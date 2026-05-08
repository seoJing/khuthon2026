"use client";

import { useEffect, useState } from "react";
import { ensureAnonymousUser } from "@/lib/firebase";
import { ensureMe } from "@/lib/api";
import { useGeoPermission } from "@/lib/useGeoPermission";
import { useLocationPing } from "@/lib/useLocationPing";
import { useNotificationsSync } from "@/lib/useNotifications";
import { useConstellationSync } from "@/lib/useConstellationSync";
import { requestPushPermission, onForegroundMessage } from "@/lib/messaging";

/**
 * 앱 마운트 시 익명 인증 + Firestore user doc upsert + (권한 있으면) 위치 핑.
 * 자식은 항상 렌더 — 백엔드 실패해도 프론트는 계속 동작.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const { state: geoState } = useGeoPermission();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stage = "auth";
      try {
        await ensureAnonymousUser();
        stage = "ensureMe";
        const tz =
          Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";
        await ensureMe({ timezone: tz });
        if (!cancelled) setAuthed(true);
      } catch (err) {
        if (cancelled) return;
        const code = (err as { code?: string }).code ?? "unknown";
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[AuthBootstrap] failed at stage:", stage, { code, err });
        setError(`[${stage}] ${code} · ${msg}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 인증 + 위치 권한 둘 다 OK일 때만 핑 시작
  useLocationPing(authed && geoState === "granted");

  // Firestore 알림 listener — 인증된 사용자의 알림 실시간 동기화
  useNotificationsSync();

  // 클라 별자리 → Firestore sync — 매칭 파이프라인이 서버에서 읽음
  useConstellationSync(authed);

  // 이미 푸시 권한 부여된 사용자는 매 세션 토큰 갱신 등록 (자동, 사용자 액션 X)
  useEffect(() => {
    if (!authed) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    let cancelled = false;
    (async () => {
      try {
        const token = await requestPushPermission();
        if (cancelled) return;
        if (token) await ensureMe({ fcmToken: token });
      } catch (err) {
        console.warn("[push] silent register failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authed]);

  // 포그라운드 메시지 — 앱이 켜져 있을 때 푸시 도착 시 콘솔 로그만
  // (Firestore listener가 이미 알림 chip 표시하므로 추가 UI 불필요)
  useEffect(() => {
    if (!authed) return;
    const unsub = onForegroundMessage((p) => {
      console.log("[push] foreground:", p);
    });
    return () => unsub();
  }, [authed]);

  return (
    <>
      {children}
      {process.env.NODE_ENV !== "production" && error && (
        <div
          className="fixed bottom-2 left-2 right-2 z-50 px-3 py-2 rounded-lg text-[10px] font-light"
          style={{
            background: "rgba(50, 10, 10, 0.85)",
            color: "rgba(255, 200, 200, 0.9)",
            backdropFilter: "blur(8px)",
          }}
        >
          [auth/db 연결 실패] {error}
        </div>
      )}
    </>
  );
}
