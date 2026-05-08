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
const PROXIMITY_M = 30;
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

// ---------- 별자리 일괄 동기화 ----------
/**
 * 클라사이드 zustand의 myStars 를 Firestore 와 일괄 sync.
 * - 매칭 파이프라인이 서버에서 별자리를 읽으려면 필수.
 * - 클라가 onboarding 완료 / 별 추가 / 떨구기 시 매번 호출 (마지막 상태 push).
 * - 7개 cap, dedup, BR-12 쿨다운 보존.
 */
export const setConstellation = onCall<{ starIds: string[] }>(async (request) => {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "Sign in required");
  const uid = request.auth.uid;
  const rawIds = Array.isArray(request.data?.starIds)
    ? request.data.starIds
    : [];
  // dedup + 7개 cap
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const id of rawIds) {
    if (typeof id !== "string" || !id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= 7) break;
  }

  const constRef = db.collection("users").doc(uid).collection("constellation");
  const existing = await constRef.get();
  const existingIds = new Set(existing.docs.map((d) => d.id));
  const targetIds = new Set(ids);

  const batch = db.batch();
  // Remove ones not in new set
  for (const doc of existing.docs) {
    if (!targetIds.has(doc.id)) batch.delete(doc.ref);
  }
  // Add ones that are new (preserve addedAt for existing)
  for (const id of ids) {
    if (!existingIds.has(id)) {
      batch.set(constRef.doc(id), {
        starId: id,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  await batch.commit();
  return { ok: true, count: ids.length };
});

// ---------- 자유 입력 별 (BR-14) ----------
/**
 * 사용자가 직접 만드는 별. 제목 + 카테고리만 받음.
 * - title 1~40자
 * - categoryId 1~16
 * - 동일 사용자가 같은 제목 다시 만들면 기존 별 ID 반환 (idempotent)
 *
 * MVP: 매칭 후보에는 포함하지 않음 (BR-14 본인만 보유). scope=global 로 저장하지만
 * 매칭 파이프라인이 isUserCreated 별을 다른 사람에게 넘기지 않도록 future-work.
 */
export const createCustomStar = onCall<{
  title: string;
  categoryId: number;
}>(async (request) => {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "Sign in required");
  const uid = request.auth.uid;
  const title = (request.data?.title ?? "").trim();
  const categoryId = request.data?.categoryId;

  if (!title || title.length < 1 || title.length > 40) {
    throw new HttpsError("invalid-argument", "제목은 1~40자");
  }
  if (
    !Number.isInteger(categoryId) ||
    categoryId < 1 ||
    categoryId > 16
  ) {
    throw new HttpsError("invalid-argument", "카테고리를 선택해주세요");
  }

  // 같은 사용자가 같은 제목으로 다시 만들면 기존 별 반환
  const existing = await db
    .collection("stars")
    .where("createdBy", "==", uid)
    .where("title", "==", title)
    .limit(1)
    .get();
  if (!existing.empty) {
    return { ok: true, starId: existing.docs[0].id, existed: true };
  }

  const rand = Math.random().toString(36).slice(2, 6);
  const id = `u_${uid.slice(0, 6)}_${Date.now()}_${rand}`;
  const tag = title
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w가-힣_]/g, "")
    .slice(0, 30) || `custom_${rand}`;

  await db
    .collection("stars")
    .doc(id)
    .set({
      id,
      tag,
      title,
      description: "",
      categoryId,
      scope: "global",
      regionCode: null,
      regionLabel: null,
      isUserCreated: true,
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  return { ok: true, starId: id, existed: false };
});

// ---------- 시연용 fake encounter (다른 사용자 없이 데모) ----------
/**
 * 친구의 태깅 로직과 충돌하지 않는 별도 데모 함수.
 * - 사용자가 모르는 별 + scope 통과 후보를 선별
 * - 무작위 3~5개를 다른 우주 풀에 추가
 * - 알림 doc 생성 (홈 알림 chip 트리거)
 *
 * Auth: 인증 필요. 누구든 자기 계정에 fake encounter 만들 수 있음.
 */
export const injectFakeEncounter = onCall<{
  region?: string;
  lat?: number;
  lng?: number;
}>(async (request) => {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "Sign in required");
  const uid = request.auth.uid;

  const userSnap = await db.collection("users").doc(uid).get();
  const user = userSnap.data() ?? {};
  const tz = (user.timezone as string) || "Asia/Seoul";
  const dayKey = dayKeyFor(tz, new Date());

  // 시연용 좌표 — 한국 주요 지역
  const SAMPLE: Record<string, { lat: number; lng: number; label: string }> = {
    성수동: { lat: 37.544, lng: 127.055, label: "성수동" },
    홍대: { lat: 37.553, lng: 126.927, label: "홍대" },
    을지로: { lat: 37.567, lng: 126.992, label: "을지로" },
    경희대: { lat: 37.243, lng: 127.078, label: "영통" },
    서울: { lat: 37.5665, lng: 126.978, label: "서울" },
  };
  let sample: { lat: number; lng: number; label: string };
  if (
    typeof request.data?.lat === "number" &&
    typeof request.data?.lng === "number"
  ) {
    // 실제 GPS 좌표 사용 (내 위치 스침)
    const lat = request.data.lat;
    const lng = request.data.lng;
    const enc0 = regionFor(lat, lng);
    sample = {
      lat,
      lng,
      label:
        enc0.neighborhood ?? enc0.city ?? enc0.country ?? "현재 위치",
    };
  } else {
    const regionKey = request.data?.region ?? "성수동";
    sample = SAMPLE[regionKey] ?? SAMPLE["성수동"];
  }
  const enc = regionFor(sample.lat, sample.lng);

    const myStarsSnap = await db
      .collection("users")
      .doc(uid)
      .collection("constellation")
      .get();
    const myIds = new Set(myStarsSnap.docs.map((d) => d.id));

    const allStarsSnap = await db.collection("stars").get();
    const candidates: Array<{
      id: string;
      scope: "global" | "country" | "city" | "neighborhood";
      regionCode: string | null;
      regionLabel: string | null;
    }> = [];
    for (const d of allStarsSnap.docs) {
      if (myIds.has(d.id)) continue;
      const data = d.data();
      const scope = data.scope as
        | "global"
        | "country"
        | "city"
        | "neighborhood";
      const regionCode = (data.regionCode as string | null) ?? null;
      if (regionMatches(scope, regionCode, enc)) {
        candidates.push({
          id: d.id,
          scope,
          regionCode,
          regionLabel: (data.regionLabel as string | null) ?? null,
        });
      }
    }

    if (candidates.length === 0) {
      throw new HttpsError("not-found", "추가 가능한 별이 없어요");
    }

    // scope 별 분리 — 더 가까운 동네 별을 먼저 우선
    const scopeRank: Record<string, number> = {
      neighborhood: 4,
      city: 3,
      country: 2,
      global: 1,
    };
    const shuffleInPlace = <T>(arr: T[]): T[] => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const byScope = candidates.reduce<Record<string, typeof candidates>>(
      (acc, c) => {
        const k = c.scope;
        (acc[k] ??= []).push(c);
        return acc;
      },
      {},
    );
    const scopeOrder = Object.keys(byScope).sort(
      (a, b) => (scopeRank[b] ?? 0) - (scopeRank[a] ?? 0),
    );
    // 동네 우선으로 가져오되 너무 적으면 상위 scope 섞음
    const targetN = Math.min(candidates.length, 3 + Math.floor(Math.random() * 3));
    const selected: typeof candidates = [];
    for (const scope of scopeOrder) {
      const pool = shuffleInPlace([...byScope[scope]]);
      for (const c of pool) {
        if (selected.length >= targetN) break;
        selected.push(c);
      }
      if (selected.length >= targetN) break;
    }

    // 다른 우주 풀에 추가
    const batch = db.batch();
    for (const s of selected) {
      const ref = db
        .collection("users")
        .doc(uid)
        .collection("otherUniverse")
        .doc(s.id);
      batch.set(ref, {
        starId: s.id,
        dayKey,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
        encounterLat: sample.lat,
        encounterLng: sample.lng,
        encounterRegion: enc,
        encounterRegionLabel: regionLabelFor(s.scope, enc) ?? s.regionLabel,
      });
    }
    await batch.commit();

    // 알림 생성
    const notifRef = db
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .doc();
    await notifRef.set({
      otherUid: "demo",
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      starCount: selected.length,
      starIds: selected.map((s) => s.id),
      opened: false,
      encounterRegionLabel:
        regionLabelFor(selected[0].scope, enc) ?? sample.label,
    });

    // FCM 푸시 — 토큰 등록되어 있으면 발송
    if (user.fcmToken) {
      try {
        await messaging.send({
          token: user.fcmToken as string,
          notification: {
            title: "누가 스쳐갔어요",
            body: `당신이 모르는 ${selected.length}개의 문화 · ${sample.label}`,
          },
          data: {
            notifId: notifRef.id,
            type: "encounter",
          },
        });
      } catch (err) {
        console.warn("[fake-encounter] FCM send failed", err);
      }
    }

    return {
      ok: true,
      notifId: notifRef.id,
      addedCount: selected.length,
      region: sample.label,
    };
});

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
