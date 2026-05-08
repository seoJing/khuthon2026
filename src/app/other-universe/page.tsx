"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CosmicBackdrop } from "@/components/Cosmos";
import { getStarsForOtherUniverseDisplay, useApp } from "@/lib/store";

export default function OtherUniversePage() {
  const router = useRouter();
  const otherUniverse = useApp((s) => s.otherUniverse);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    setSeed(Math.random());
  }, []);

  const displayed = useMemo(
    () => getStarsForOtherUniverseDisplay(otherUniverse, 7),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [otherUniverse, seed],
  );

  return (
    <div className="absolute inset-0">
      <CosmicBackdrop
        density={1.5}
        drift={1.4}
        variant="warm"
        interactive
        constellation={{
          starIds: displayed.map((u) => u.starId),
          onTap: (starId) =>
            router.push(`/card?ctx=pool&starId=${encodeURIComponent(starId)}`),
        }}
      />

      <header className="absolute top-0 left-0 right-0 safe-top z-10 px-6 pt-3 flex items-start justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <p className="label-kr">다른 우주</p>
          <p className="text-[11px] text-fg-muted mt-2 font-light tracking-wide">
            오늘 스쳐간 {otherUniverse.length}개의 문화
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full glass active:scale-95 transition text-fg-dim text-[14px] pointer-events-auto"
          aria-label="닫기"
        >
          ✕
        </button>
      </header>

      <button
        onClick={() => router.back()}
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
      </button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1.2 }}
        className="absolute bottom-20 left-0 right-0 text-center label-kr-fine pointer-events-none"
      >
        자정에 사라져요
      </motion.p>
    </div>
  );
}
