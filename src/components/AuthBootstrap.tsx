"use client";

import { useEffect, useState } from "react";
import { ensureAnonymousUser } from "@/lib/firebase";
import { ensureMe } from "@/lib/api";

/**
 * 앱 마운트 시 익명 인증 + Firestore user doc upsert.
 * 서버사이드 매칭 파이프라인이 사용자 timezone 등을 알 수 있게.
 * 자식은 항상 렌더 — 백엔드 실패해도 프론트는 계속 동작 (BR-05 익명성 + offline-first).
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stage = "auth";
      try {
        await ensureAnonymousUser();
        stage = "ensureMe";
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul";
        await ensureMe({ timezone: tz });
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
