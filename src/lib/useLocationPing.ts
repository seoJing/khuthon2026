"use client";

import { useEffect, useRef } from "react";
import { handlePingRemote } from "./api";

const PING_INTERVAL_MS = 60_000;
const PING_MIN_GAP_MS = 30_000;
const STALE_LOCATION_MS = 2 * 60_000;

/**
 * 앱이 활성 상태일 때 60초 간격으로 위치 핑을 백엔드에 전송.
 *
 * - tab visible 일 때만 핑 (visibilitychange 감지)
 * - 권한 거부 시 자동 중단
 * - 동일 위치(같은 좌표)는 30초 이내 재전송 안 함
 * - handlePingRemote 호출 결과 무시 (서버에서 매칭 처리)
 */
export function useLocationPing(enabled: boolean) {
  const lastPingTsRef = useRef<number>(0);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const inflightRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;
    let intervalId: number | null = null;

    const fetchAndPing = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.hidden) return;
      if (inflightRef.current) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const now = Date.now();

          // 너무 자주 같은 위치 핑 방지
          const last = lastPosRef.current;
          const gap = now - lastPingTsRef.current;
          if (
            last &&
            Math.abs(last.lat - lat) < 1e-5 &&
            Math.abs(last.lng - lng) < 1e-5 &&
            gap < PING_MIN_GAP_MS
          ) {
            return;
          }

          inflightRef.current = true;
          try {
            await handlePingRemote({ lat, lng });
            lastPosRef.current = { lat, lng };
            lastPingTsRef.current = now;
          } catch (err) {
            console.warn("[ping] failed", err);
          } finally {
            inflightRef.current = false;
          }
        },
        (err) => {
          // 권한 거부 시 더 이상 시도하지 않음
          if (err.code === err.PERMISSION_DENIED) {
            cancelled = true;
            if (intervalId !== null) window.clearInterval(intervalId);
          }
        },
        // 고정밀 GPS — 30m 임계 매칭 정확도를 위해 (배터리 소모 더 큼)
        { enableHighAccuracy: true, timeout: 12_000, maximumAge: STALE_LOCATION_MS },
      );
    };

    // 첫 핑 즉시
    fetchAndPing();

    intervalId = window.setInterval(fetchAndPing, PING_INTERVAL_MS);

    const onVisibility = () => {
      if (!document.hidden) fetchAndPing();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (intervalId !== null) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);
}
