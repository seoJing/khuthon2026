"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CosmicBackdrop } from "@/components/Cosmos";
import { useApp } from "@/lib/store";
import { getEncounterStarsRemote, markNotificationOpenedRemote, type EncounterStarMeta } from "@/lib/api";

interface LoadState {
  loading: boolean;
  stars: EncounterStarMeta[];
  encounterRegionLabel: string | null;
  error: string | null;
}

export default function EncounterPage() {
  const router = useRouter();
  const params = useParams<{ notifId: string }>();
  const notifId = params?.notifId;
  const myStars = useApp((s) => s.myStars);
  const markOpenedLocal = useApp((s) => s.markNotificationOpenedLocal);

  const [state, setState] = useState<LoadState>({
    loading: true,
    stars: [],
    encounterRegionLabel: null,
    error: null,
  });

  useEffect(() => {
    if (!notifId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await getEncounterStarsRemote({ notifId });
        if (cancelled) return;
        setState({
          loading: false,
          stars: r.stars,
          encounterRegionLabel: r.encounterRegionLabel,
          error: null,
        });
        // 열람 처리 (로컬 + 서버)
        markOpenedLocal(notifId);
        markNotificationOpenedRemote({ notifId }).catch(() => undefined);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setState({
          loading: false,
          stars: [],
          encounterRegionLabel: null,
          error: msg,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [notifId, markOpenedLocal]);

  // BR-02: 모르는 별만 — 백엔드에서 이미 처리되지만 클라사이드도 한 번 더 가드
  const unknown = useMemo(() => {
    const mine = new Set(myStars.map((s) => s.starId));
    return state.stars.filter((s) => !mine.has(s.id));
  }, [state.stars, myStars]);

  return (
    <div className="absolute inset-0">
      <CosmicBackdrop
        density={1.3}
        variant="warm"
        interactive
        constellation={
          unknown.length > 0
            ? {
                starIds: unknown.map((s) => s.id),
                onTap: (starId) =>
                  router.push(
                    `/card?ctx=their&starId=${encodeURIComponent(starId)}&notif=${encodeURIComponent(notifId ?? "")}`,
                  ),
              }
            : undefined
        }
      />

      <header className="absolute top-0 left-0 right-0 safe-top z-10 px-6 pt-3 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <p className="label-kr">누가 스쳐갔어요</p>
          <p className="text-[11px] text-fg-muted mt-2 font-light tracking-wide">
            {state.loading
              ? "별을 살펴보는 중…"
              : unknown.length > 0
              ? `당신이 모르는 ${unknown.length}개의 별${state.encounterRegionLabel ? ` · ${state.encounterRegionLabel}` : ""}`
              : "이미 모두 알고 있어요"}
          </p>
        </div>
        <button
          onClick={() => router.replace("/home")}
          className="w-10 h-10 flex items-center justify-center rounded-full glass active:scale-95 transition text-fg-dim text-[14px] pointer-events-auto"
          aria-label="닫기"
        >
          ✕
        </button>
      </header>

      {state.loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="label-kr">별을 살펴보는 중…</p>
        </div>
      )}

      {!state.loading && state.error && (
        <div className="absolute inset-0 flex items-center justify-center px-10 pointer-events-none">
          <div className="text-center">
            <p className="label-kr text-rose-300/80">불러올 수 없어요</p>
            <p className="mt-2 text-[10px] text-fg-muted font-light max-w-[260px] mx-auto">
              {state.error}
            </p>
          </div>
        </div>
      )}

      {!state.loading && !state.error && unknown.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center px-10 pointer-events-none">
          <p className="label-kr text-center">모르는 별이 없어요</p>
        </div>
      )}

      {!state.loading && unknown.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          onClick={() => router.replace("/home")}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 glass rounded-full px-4 py-2 flex items-center gap-2 active:scale-95 transition pointer-events-auto"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-fg-dim"
            />
          </svg>
          <span className="label-kr-bright">내 우주</span>
        </motion.button>
      )}
    </div>
  );
}
