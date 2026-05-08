"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CosmicBackdrop } from "@/components/Cosmos";
import { useApp } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const myStars = useApp((s) => s.myStars);
  const onboarded = useApp((s) => s.onboarded);
  const otherUniverse = useApp((s) => s.otherUniverse);
  const [hydrated, setHydrated] = useState(false);
  const [showHint, setShowHint] = useState(true);

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
        <button
          onClick={() => router.push("/settings")}
          className="label-kr-bright active:text-fg transition px-1 pointer-events-auto"
        >
          설정
        </button>
      </header>

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
