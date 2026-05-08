"use client";

import { useEffect, useRef } from "react";
import { setConstellationRemote } from "./api";
import { useApp } from "./store";

const DEBOUNCE_MS = 600;

/**
 * 클라사이드 myStars 가 변경될 때마다 Firestore와 sync.
 * 매칭 파이프라인이 서버 별자리를 읽으려면 필수.
 *
 * - debounce 600ms (빠른 연속 변경 묶음)
 * - 인증된 사용자만
 * - 실패해도 silent (다음 변경 때 재시도)
 */
export function useConstellationSync(enabled: boolean) {
  const myStars = useApp((s) => s.myStars);
  const timerRef = useRef<number | null>(null);
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;
    const ids = myStars.map((s) => s.starId);
    const key = ids.join(",");
    if (key === lastSyncedRef.current) return;

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        await setConstellationRemote({ starIds: ids });
        lastSyncedRef.current = key;
      } catch (err) {
        console.warn("[constellation-sync] failed", err);
      }
      timerRef.current = null;
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, myStars]);
}
