import { setGlobalOptions } from "firebase-functions/v2";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from "geofire-common";

import { dayKeyFor } from "./dayKey";
import { regionFor, regionLabelFor, regionMatches } from "./regions";
import { CATEGORIES, STARS, CONTENTS } from "./seed";
import { YOUTUBE_API_KEY, searchYouTubeShorts, type YTVideo } from "./youtube";

setGlobalOptions({ region: "asia-northeast3", maxInstances: 10 });

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// ---------- 공통 상수 ----------
const PROXIMITY_M = 100;
const COOLDOWN_DAYS = 7;
const ALERT_DAILY_LIMIT = 5;
const PING_TTL_MIN = 5;

// ---------- Auth: 사용자 doc 자동 생성 ----------
/**
 * 클라가 ensureMe() 호출 → users/{uid} doc upsert.
 * timezone, fcmToken 같은 메타도 여기서 갱신.
 */
export const ensureMe = onCall<{ timezone?: string; fcmToken?: string | null }>(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required");
    }
    const uid = request.auth.uid;
    const ref = db.collection("users").doc(uid);
    const data: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (request.data.timezone) data.timezone = request.data.timezone;
    if (request.data.fcmToken !== undefined) data.fcmToken = request.data.fcmToken;
    const snap = await ref.get();
    if (!snap.exists) {
      data.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }
    await ref.set(data, { merge: true });
    return { ok: true, uid };
  },
);

// ---------- 카탈로그 시드 (관리자용) ----------
/**
 * 카테고리·별·콘텐츠 일괄 주입. 멱등: 동일 ID는 덮어씀.
 * 첫 실행만 의미. 콘솔에서 callable로 trigger.
 *
 * Auth: 일단 누구든 호출 가능 (대용량 idempotent). 운영 전엔 admin 가드 필요.
 */
export const seedCatalog = onCall<{ confirm: string }>(async (request) => {
  if (request.data.confirm !== "yes-i-am-sure") {
    throw new HttpsError("invalid-argument", "Pass confirm: 'yes-i-am-sure'");
  }
  const batchSize = 400;
  const writeMany = async (
    coll: string,
    docs: Array<{ id: string | number } & Record<string, unknown>>,
  ) => {
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const slice = docs.slice(i, i + batchSize);
      for (const d of slice) {
        const ref = db.collection(coll).doc(String(d.id));
        batch.set(ref, d, { merge: true });
      }
      await batch.commit();
    }
  };

  await writeMany(
    "categories",
    CATEGORIES as unknown as Array<{ id: string | number } & Record<string, unknown>>,
  );
  await writeMany(
    "stars",
    STARS as unknown as Array<{ id: string | number } & Record<string, unknown>>,
  );
  await writeMany(
    "contents",
    CONTENTS as unknown as Array<{ id: string | number } & Record<string, unknown>>,
  );

  return {
    ok: true,
    counts: {
      categories: CATEGORIES.length,
      stars: STARS.length,
      contents: CONTENTS.length,
    },
  };
});

// ---------- 위치 핑 + 매칭 파이프라인 (UC-02) ----------
interface PingPayload {
  lat: number;
  lng: number;
}

export const handlePing = onCall<PingPayload>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required");
  }
  const viewerId = request.auth.uid;
  const { lat, lng } = request.data;
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new HttpsError("invalid-argument", "lat/lng required");
  }

  const now = admin.firestore.Timestamp.now();
  const geohash = geohashForLocation([lat, lng]);

  // 1. 자기 위치 upsert
  await db.collection("pings").doc(viewerId).set({
    userId: viewerId,
    lat,
    lng,
    geohash,
    pingedAt: now,
  });

  // 2. 100m 이내 활성 사용자 조회
  const bounds = geohashQueryBounds([lat, lng], PROXIMITY_M);
  const ttlMs = PING_TTL_MIN * 60 * 1000;
  const fresh = admin.firestore.Timestamp.fromMillis(
    Date.now() - ttlMs,
  );

  const candidateIds = new Set<string>();
  for (const b of bounds) {
    const snap = await db
      .collection("pings")
      .orderBy("geohash")
      .startAt(b[0])
      .endAt(b[1])
      .get();
    for (const d of snap.docs) {
      const data = d.data() as { userId: string; lat: number; lng: number; pingedAt: FirebaseFirestore.Timestamp };
      if (data.userId === viewerId) continue;
      if (data.pingedAt && data.pingedAt.toMillis() < fresh.toMillis()) continue;
      const distM = distanceBetween([lat, lng], [data.lat, data.lng]) * 1000;
      if (distM <= PROXIMITY_M) {
        candidateIds.add(data.userId);
      }
    }
  }

  // 3. 각 후보와 매칭 처리
  const summary: { processed: number; skippedByEncounter: number; viewerAdded: number; otherAdded: number } = {
    processed: 0,
    skippedByEncounter: 0,
    viewerAdded: 0,
    otherAdded: 0,
  };
  for (const otherId of candidateIds) {
    const r = await processEncounter({ viewerId, otherId, lat, lng });
    summary.processed += 1;
    if (r === "encounter-exists") summary.skippedByEncounter += 1;
    else {
      summary.viewerAdded += r.viewerAdded;
      summary.otherAdded += r.otherAdded;
    }
  }

  return { ok: true, summary };
});

async function processEncounter(args: {
  viewerId: string;
  otherId: string;
  lat: number;
  lng: number;
}): Promise<
  | "encounter-exists"
  | { viewerAdded: number; otherAdded: number }
> {
  const { viewerId, otherId, lat, lng } = args;
  const [a, b] = [viewerId, otherId].sort();
  const encounterId = `${a}_${b}`;
  const encounterRef = db.collection("encounters").doc(encounterId);

  // BR-04: 사람 단위 영구 dedup
  const encSnap = await encounterRef.get();
  if (encSnap.exists) {
    return "encounter-exists";
  }

  // 두 사용자 모두 처리
  const viewerAdded = await processForViewer(viewerId, otherId, lat, lng);
  const otherAdded = await processForViewer(otherId, viewerId, lat, lng);

  // 영구 인카운터 기록 (양쪽 처리 후)
  await encounterRef.set({
    userAId: a,
    userBId: b,
    firstMetAt: admin.firestore.FieldValue.serverTimestamp(),
    metLat: lat,
    metLng: lng,
  });

  return { viewerAdded, otherAdded };
}

interface StarMeta {
  id: string;
  scope: "global" | "country" | "city" | "neighborhood";
  regionCode: string | null;
  regionLabel: string | null;
}

async function processForViewer(
  viewerId: string,
  otherId: string,
  lat: number,
  lng: number,
): Promise<number> {
  const viewerSnap = await db.collection("users").doc(viewerId).get();
  const viewer = viewerSnap.data() ?? {};
  const tz = (viewer.timezone as string) || "Asia/Seoul";
  const dayKey = dayKeyFor(tz, new Date());

  const [myStarsSnap, otherStarsSnap, cooldownsSnap] = await Promise.all([
    db.collection("users").doc(viewerId).collection("constellation").get(),
    db.collection("users").doc(otherId).collection("constellation").get(),
    db
      .collection("users")
      .doc(viewerId)
      .collection("cooldowns")
      .where("expiresAt", ">", admin.firestore.Timestamp.now())
      .get(),
  ]);

  const myStarIds = new Set(myStarsSnap.docs.map((d) => d.id));
  const cooldownIds = new Set(cooldownsSnap.docs.map((d) => d.id));
  const otherStarIds = otherStarsSnap.docs.map((d) => d.id);

  // BR-02: 모르는 별만
  let candidateIds = otherStarIds.filter((id) => !myStarIds.has(id));
  // BR-12: 7일 쿨다운 제외
  candidateIds = candidateIds.filter((id) => !cooldownIds.has(id));
  if (candidateIds.length === 0) return 0;

  // 별 메타 조회 (scope/region)
  const starMetas: StarMeta[] = [];
  // batch get (300개 이하)
  const refs = candidateIds.map((id) => db.collection("stars").doc(id));
  const docs = await db.getAll(...refs);
  for (const d of docs) {
    if (!d.exists) continue;
    const data = d.data()!;
    starMetas.push({
      id: d.id,
      scope: data.scope,
      regionCode: data.regionCode ?? null,
      regionLabel: data.regionLabel ?? null,
    });
  }

  // BR-20: scope 필터
  const enc = regionFor(lat, lng);
  let passed = starMetas.filter((s) => regionMatches(s.scope, s.regionCode, enc));
  if (passed.length === 0) return 0;

  // BR-16: 풀 별 dedup (오늘 풀에 이미 있는 별 제외)
  const poolSnap = await db
    .collection("users")
    .doc(viewerId)
    .collection("otherUniverse")
    .where("dayKey", "==", dayKey)
    .get();
  const inPool = new Set(poolSnap.docs.map((d) => d.id));
  const finalStars = passed.filter((s) => !inPool.has(s.id));
  if (finalStars.length === 0) return 0;

  // 풀에 추가
  const batch = db.batch();
  for (const s of finalStars) {
    const ref = db
      .collection("users")
      .doc(viewerId)
      .collection("otherUniverse")
      .doc(s.id);
    batch.set(ref, {
      starId: s.id,
      dayKey,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      encounterLat: lat,
      encounterLng: lng,
      encounterRegion: enc,
      encounterRegionLabel: regionLabelFor(s.scope, enc) ?? s.regionLabel,
    });
  }
  await batch.commit();

  // BR-18: 알림 일 5회 한도
  const alertRef = db
    .collection("users")
    .doc(viewerId)
    .collection("dailyAlerts")
    .doc(String(dayKey));
  const allowedAlert = await db.runTransaction(async (tx) => {
    const snap = await tx.get(alertRef);
    const cur = (snap.exists ? (snap.data()!.count as number) : 0) || 0;
    if (cur >= ALERT_DAILY_LIMIT) return false;
    tx.set(
      alertRef,
      { count: cur + 1, dayKey, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
    return true;
  });

  if (allowedAlert) {
    // 알림 doc 생성
    const notifRef = db
      .collection("users")
      .doc(viewerId)
      .collection("notifications")
      .doc();
    await notifRef.set({
      otherUid: otherId, // 서버 내부용. 클라엔 token만 노출 권장
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      starCount: finalStars.length,
      starIds: finalStars.map((s) => s.id),
      opened: false,
      encounterRegionLabel: regionLabelFor(finalStars[0].scope, enc) ?? null,
    });

    // FCM 푸시
    if (viewer.fcmToken) {
      try {
        await messaging.send({
          token: viewer.fcmToken as string,
          notification: {
            title: "누가 스쳐갔어요",
            body: `당신이 모르는 ${finalStars.length}개의 문화`,
          },
          data: {
            notifId: notifRef.id,
            type: "encounter",
          },
        });
      } catch (err) {
        console.warn("FCM send failed", err);
      }
    }
  }

  return finalStars.length;
}

// ---------- 별 추가/떨구기 (BR-01, BR-12) ----------
/**
 * 별자리에 별 추가. 최대 7. 풀가득 시 client에서 replaceTargetId 지정.
 * 트랜잭션: 모든 read 먼저 → write.
 */
export const addStarToConstellation = onCall<{
  starId: string;
  replaceTargetId?: string;
}>(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required");
  const uid = request.auth.uid;
  const { starId, replaceTargetId } = request.data;
  if (!starId) throw new HttpsError("invalid-argument", "starId required");

  const userRef = db.collection("users").doc(uid);
  const constRef = userRef.collection("constellation");

  await db.runTransaction(async (tx) => {
    // READ phase
    const starsSnap = await tx.get(constRef);
    const cooldownDoc = await tx.get(userRef.collection("cooldowns").doc(starId));
    const targetDocSnap = replaceTargetId
      ? await tx.get(constRef.doc(replaceTargetId))
      : null;

    const ids = new Set(starsSnap.docs.map((d) => d.id));

    if (ids.has(starId)) return; // 이미 있음
    if (cooldownDoc.exists) {
      const exp = cooldownDoc.data()!.expiresAt as FirebaseFirestore.Timestamp;
      if (exp && exp.toMillis() > Date.now()) {
        throw new HttpsError(
          "failed-precondition",
          "쿨다운 중인 별입니다",
        );
      }
    }
    if (ids.size >= 7) {
      if (!replaceTargetId) {
        throw new HttpsError(
          "failed-precondition",
          "별자리가 가득 찼어요. replaceTargetId 지정 필요",
        );
      }
      if (!targetDocSnap || !targetDocSnap.exists) {
        throw new HttpsError("not-found", "교체 대상 별이 없어요");
      }
    }

    // WRITE phase
    if (replaceTargetId && ids.size >= 7) {
      tx.delete(constRef.doc(replaceTargetId));
      tx.set(userRef.collection("cooldowns").doc(replaceTargetId), {
        droppedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(
          Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
        ),
      });
    }
    tx.set(constRef.doc(starId), {
      starId,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});

/**
 * 별자리에서 별 떨구기. BR-01: 최소 1개 보장.
 */
export const dropStarFromConstellation = onCall<{ starId: string }>(
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Sign in required");
    const uid = request.auth.uid;
    const { starId } = request.data;
    if (!starId) throw new HttpsError("invalid-argument", "starId required");

    const userRef = db.collection("users").doc(uid);
    const constRef = userRef.collection("constellation");

    await db.runTransaction(async (tx) => {
      const starsSnap = await tx.get(constRef);
      const ids = starsSnap.docs.map((d) => d.id);
      if (!ids.includes(starId)) return;
      if (ids.length <= 1) {
        throw new HttpsError(
          "failed-precondition",
          "당신의 우주에 마지막 별이에요",
        );
      }
      tx.delete(constRef.doc(starId));
      tx.set(userRef.collection("cooldowns").doc(starId), {
        droppedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(
          Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
        ),
      });
    });

    return { ok: true };
  },
);

/**
 * 알림 열람 처리 (UC-03).
 */
export const markNotificationOpened = onCall<{ notifId: string }>(
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Sign in required");
    const uid = request.auth.uid;
    const { notifId } = request.data;
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .doc(notifId);
    await ref.set(
      { opened: true, openedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
    return { ok: true };
  },
);

/**
 * 별의 YouTube Shorts 무한 피드 (UC-05).
 * 입력: { starId, pageToken? }
 * 출력: { videos: YTVideo[], nextPageToken: string | null, cached: boolean }
 *
 * Firestore 캐시: stars/{starId}/feed/{cacheKey} TTL 6h.
 * 같은 (starId, pageToken) 6시간 내 재호출은 캐시 반환 → 쿼터 절약.
 */
export const getStarFeed = onCall<{ starId: string; pageToken?: string }>(
  { secrets: [YOUTUBE_API_KEY] },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Sign in required");
    const { starId, pageToken } = request.data;
    if (!starId) throw new HttpsError("invalid-argument", "starId required");

    const starSnap = await db.collection("stars").doc(starId).get();
    if (!starSnap.exists)
      throw new HttpsError("not-found", "Star not found");
    const star = starSnap.data()!;
    const title = (star.title as string) || (star.tag as string) || starId;
    const tag = (star.tag as string) || undefined;
    const categoryId = (star.categoryId as number) || undefined;

    // 캐시 키 v2 — 필터 로직 변경되었으니 옛 캐시 무효화
    const cacheKey = pageToken
      ? `v2_p_${pageToken.replace(/[^a-zA-Z0-9_-]/g, "_")}`
      : "v2_p0";
    const cacheRef = db
      .collection("stars")
      .doc(starId)
      .collection("feed")
      .doc(cacheKey);

    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      const data = cacheSnap.data()!;
      const expiresAt = data.expiresAt as
        | FirebaseFirestore.Timestamp
        | undefined;
      if (expiresAt && expiresAt.toMillis() > Date.now()) {
        return {
          videos: (data.videos ?? []) as YTVideo[],
          nextPageToken: (data.nextPageToken as string | null) ?? null,
          cached: true,
        };
      }
    }

    const result = await searchYouTubeShorts({
      title,
      tag,
      categoryId,
      pageToken,
    });

    await cacheRef.set({
      title,
      categoryId: categoryId ?? null,
      videos: result.videos,
      nextPageToken: result.nextPageToken,
      fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(
        Date.now() + 6 * 60 * 60 * 1000,
      ),
    });

    return {
      videos: result.videos,
      nextPageToken: result.nextPageToken,
      cached: false,
    };
  },
);

/**
 * 알림에 담긴 모르는 별 목록 (UC-03).
 * 클라가 notifId 들고 호출 → 모르는 별 메타 + 콘텐츠 ID 반환.
 */
export const getEncounterStars = onCall<{ notifId: string }>(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required");
  const uid = request.auth.uid;
  const { notifId } = request.data;

  const notifRef = db
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .doc(notifId);
  const notifSnap = await notifRef.get();
  if (!notifSnap.exists)
    throw new HttpsError("not-found", "알림을 찾을 수 없어요");
  const notif = notifSnap.data()!;
  const starIds = (notif.starIds as string[]) ?? [];
  if (starIds.length === 0) return { stars: [] };

  // 별 메타 조회
  const refs = starIds.map((id) => db.collection("stars").doc(id));
  const docs = await db.getAll(...refs);
  const stars = docs
    .filter((d) => d.exists)
    .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

  return { stars, encounterRegionLabel: notif.encounterRegionLabel ?? null };
});
