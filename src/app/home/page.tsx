"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { ConstellationView } from "@/components/ConstellationView";
import { CosmicBackdrop } from "@/components/Cosmos";
import { useApp } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const myStars = useApp((s) => s.myStars);
  const onboarded = useApp((s) => s.onboarded);
  const otherUniverse = useApp((s) => s.otherUniverse);
  const [hydrated, setHydrated] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const dragY = useMotionValue(0);
  const triggeredRef = useRef(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, router]);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5500);
    return () => clearTimeout(t);
  }, []);

  const onDragEnd = (_: unknown, info: { offset: { y: number } }) => {
    if (info.offset.y < -80 && !triggeredRef.current) {
      triggeredRef.current = true;
      router.push("/other-universe");
    }
  };

  return (
    <div className="absolute inset-0">
      <CosmicBackdrop density={1.1} variant="deep" />

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
            <p className="label-kr">내 별자리</p>
            <h2 className="display-medium text-[20px] mt-2 leading-none">
              <span className="font-light">{myStars.length}</span>
              <span className="text-fg-muted font-extralight"> / 7</span>
            </h2>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className="label-kr-bright active:text-fg transition px-1"
          >
            설정
          </button>
        </header>

        <ConstellationView
          starIds={myStars.map((s) => s.starId)}
          onTap={(starId) =>
            router.push(`/card?ctx=mine&starId=${encodeURIComponent(starId)}`)
          }
        />

        <AnimatePresence>
          {showHint && otherUniverse.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, -5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-12 left-0 right-0 flex flex-col items-center pointer-events-none"
            >
              <p className="label-kr-fine mb-2.5">위로 쓸어올리기</p>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 15l-6-6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-fg-muted"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
