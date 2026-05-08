"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CosmicBackdrop } from "@/components/Cosmos";
import { WarpOverlay } from "@/components/WarpOverlay";
import { useApp } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const myStars = useApp((s) => s.myStars);
  const onboarded = useApp((s) => s.onboarded);
  const otherUniverse = useApp((s) => s.otherUniverse);
  const notifications = useApp((s) => s.notifications);
  const [hydrated, setHydrated] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [warping, setWarping] = useState(false);

  // 알림 chip 또는 종 아이콘 → 워프 트랜지션 → encounter
  const enterEncounter = (notifId: string) => {
    if (warping) return;
    setWarping(true);
    // 워프 시작 후 ~750ms 시점에 navigate, 트랜지션이 자연스럽게 새 화면으로 이어짐
    window.setTimeout(() => {
      router.push(`/encounter/${notifId}`);
    }, 750);
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.opened).length,
    [notifications],
  );
  const latestUnread = useMemo(
    () => notifications.find((n) => !n.opened) ?? null,
    [notifications],
  );

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0">
      <CosmicBackdrop
        density={1.1}
        variant="deep"
        interactive
        constellation={{
          starIds: myStars.map((s) => s.starId),
          onTap: (starId) =>
            router.push(`/card?ctx=mine&starId=${encodeURIComponent(starId)}`),
        }}
      />

      <header className="absolute top-0 left-0 right-0 safe-top z-10 px-6 pt-3 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <p className="label-kr">내 별자리</p>
          <h2 className="display-medium text-[20px] mt-2 leading-none">
            <span className="font-light">{myStars.length}</span>
            <span className="text-fg-muted font-extralight"> / 7</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          {unreadCount > 0 && latestUnread && (
            <button
              onClick={() => enterEncounter(latestUnread.id)}
              className="relative w-10 h-10 flex items-center justify-center rounded-full glass active:scale-95 transition"
              aria-label={`알림 ${unreadCount}개`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-fg-dim"
                />
                <path
                  d="M10 21a2 2 0 0 0 4 0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-fg-dim"
                />
              </svg>
              <span
                className="absolute top-1.5 right-1.5 rounded-full"
                style={{
                  width: 7,
                  height: 7,
                  background: "rgb(245, 231, 196)",
                  boxShadow:
                    "0 0 8px rgba(245, 231, 196, 0.95), 0 0 18px rgba(245, 200, 130, 0.6)",
                }}
              />
            </button>
          )}
          <button
            onClick={() => router.push("/settings")}
            className="label-kr-bright active:text-fg transition px-1"
          >
            설정
          </button>
        </div>
      </header>

      <AnimatePresence>
        {unreadCount > 0 && latestUnread && (
          <motion.button
            key={latestUnread.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            onClick={() => enterEncounter(latestUnread.id)}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-10 glass rounded-full px-4 py-2.5 flex items-center gap-2.5 active:scale-[0.97] transition pointer-events-auto"
            style={{
              border: "1px solid rgba(245, 231, 196, 0.22)",
              boxShadow: "0 0 24px rgba(245, 231, 196, 0.18)",
            }}
          >
            <span
              className="block rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "rgb(245, 231, 196)",
                boxShadow:
                  "0 0 10px rgba(245, 231, 196, 1), 0 0 20px rgba(245, 200, 130, 0.6)",
              }}
            />
            <span
              className="text-[12px] font-light tracking-tight"
              style={{ color: "rgba(243, 240, 234, 0.95)" }}
            >
              누가 스쳐갔어요
            </span>
            <span
              className="text-[10px] font-light tracking-wide"
              style={{ color: "rgba(243, 240, 234, 0.55)" }}
            >
              {latestUnread.starCount}개의 모르는 문화
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {otherUniverse.length > 0 && (
        <button
          onClick={() => router.push("/other-universe")}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 glass rounded-full px-4 py-2 flex items-center gap-2 active:scale-95 transition pointer-events-auto"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 15l-6-6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-fg-dim"
            />
          </svg>
          <span className="label-kr-bright">다른 우주</span>
        </button>
      )}

      <WarpOverlay active={warping} />

      <AnimatePresence>
        {showHint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            className="absolute top-20 left-0 right-0 text-center label-kr-fine pointer-events-none z-10"
          >
            드래그·핀치로 별자리 주위를 둘러보세요
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
