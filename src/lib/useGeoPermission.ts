"use client";

import { useCallback, useEffect, useState } from "react";

export type GeoState = "idle" | "prompt" | "granted" | "denied" | "unavailable";

/**
 * navigator.permissions + getCurrentPosition 통합 훅.
 * - state 자동 동기화 (permissions API onchange)
 * - request() 호출 시 즉시 위치 1회 획득
 */
export function useGeoPermission() {
  const [state, setState] = useState<GeoState>("idle");

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("unavailable");
      return;
    }
    if (!navigator.permissions) {
      setState("prompt");
      return;
    }
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((result) => {
        if (cancelled) return;
        setState(result.state as GeoState);
        result.onchange = () => {
          if (cancelled) return;
          setState(result.state as GeoState);
        };
      })
      .catch(() => {
        if (!cancelled) setState("prompt");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const request = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setState("unavailable");
        reject(new Error("geolocation unavailable"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setState("granted");
          resolve(pos);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setState("denied");
          }
          reject(err);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    });
  }, []);

  return { state, request };
}
