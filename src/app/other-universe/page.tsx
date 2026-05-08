"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { ConstellationView } from "@/components/ConstellationView";
import { CosmicBackdrop } from "@/components/Cosmos";
import { getStarsForOtherUniverseDisplay, useApp } from "@/lib/store";

export default function OtherUniversePage() {
  const router = useRouter();
  const otherUniverse = useApp((s) => s.otherUniverse);
  const [seed, setSeed] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const dragY = useMotionValue(0);
  const triggeredRef = useRef(false);

  useEffect(() => {
    setSeed(Math.random());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5500);
    return () => clearTimeout(t);
  }, []);

  const displayed = useMemo(
    () => getStarsForOtherUniverseDisplay(otherUniverse, 7),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [otherUniverse, seed],
  );

  const onDragEnd = (_: unknown, info: { offset: { y: number } }) => {
    if (info.offset.y > 80 && !triggeredRef.current) {
      triggeredRef.current = true;
      router.back();
    }
  };

  return (
    <div className="absolute inset-0">
      <CosmicBackdrop density={1.5} drift={1.4} variant="warm" />

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={onDragEnd}
        style={{ y: dragY }}
        className="absolute inset-0 touch-none"
      >
        <header className="absolute top-0 left-0 right-0 safe-top z-10 px-6 pt-3 flex items-start justify-between">
          <div>
            <p className="label-kr">다른 우주</p>
            <p className="text-[11px] text-fg-muted mt-2 font-light tracking-wide">
              오늘 스쳐간 {otherUniverse.length}개의 문화
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full glass active:scale-95 transition text-fg-dim text-[14px]"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <ConstellationView
          starIds={displayed.map((u) => u.starId)}
          emptyMessage="오늘은 아직 마주친 별이 없어요"
          onTap={(starId) =>
            router.push(`/card?ctx=pool&starId=${encodeURIComponent(starId)}`)
          }
        />

        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, 5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-16 left-0 right-0 flex flex-col items-center pointer-events-none"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-fg-muted"
                />
              </svg>
              <p className="label-kr-fine mt-2.5">아래로 쓸어내려 내 우주로</p>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="absolute bottom-5 left-0 right-0 text-center px-8 label-kr-fine pointer-events-none">
          자정에 사라져요
        </p>
      </motion.div>
    </div>
  );
}
