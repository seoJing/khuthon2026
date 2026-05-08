"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";

interface Streak {
  angle: number;
  delay: number;
  length: number;
  thickness: number;
  speed: number;
}

function makeStreaks(count: number, seed: number): Streak[] {
  const out: Streak[] = [];
  // Mulberry32 deterministic
  let a = seed | 0 || 1;
  const rng = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    out.push({
      angle: (i / count) * 360 + (rng() - 0.5) * 8,
      delay: i * 0.006 + rng() * 0.05,
      length: 600 + rng() * 700,
      thickness: 1 + rng() * 1.5,
      speed: 0.7 + rng() * 0.35,
    });
  }
  return out;
}

interface Props {
  active: boolean;
  /** 한 번 사라질 때 호출 — 부모가 cleanup */
  onComplete?: () => void;
  /**
   * "out": 중심에서 사방으로 폭발 (다른 우주로 텔레포트 느낌)
   * "in":  사방에서 중심으로 빨려들어감 (내 우주로 진입 느낌)
   */
  mode?: "out" | "in";
}

/**
 * 우주 워프 트랜지션 — 시연용 시네마틱.
 *
 * 시퀀스 (총 1.05s):
 *   0~30%   배경이 빠르게 어두워지며 중앙 광점 응축
 *   10~80%  사방으로 별빛 스트릭이 폭발적으로 뻗어나감 (워프 터널)
 *   60~100% 화면 전체가 흰빛으로 가득 → 부드러운 페이드아웃
 */
export function WarpOverlay({ active, onComplete, mode = "out" }: Props) {
  const streaks = useMemo(() => makeStreaks(56, 7), []);
  const isIn = mode === "in";

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => {
      onComplete?.();
    }, 1050);
    return () => window.clearTimeout(t);
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="warp"
          className="fixed inset-0 z-[100] overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* 배경 어두워짐 — in 모드는 끝부분에 우주로 진입하면서 살짝 밝아짐 */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "#04050a" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.95, 0.95, 1, 0] }}
            transition={{
              duration: 1.05,
              times: [0, 0.18, 0.4, 0.7, 0.92, 1],
            }}
          />

          {/* 중심 광점 — out: 폭발해서 커짐, in: 끝에 도착하면서 폭발 */}
          <motion.div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "white",
              boxShadow:
                "0 0 40px rgba(255, 245, 215, 1), 0 0 110px rgba(255, 220, 160, 0.85), 0 0 220px rgba(245, 180, 100, 0.55)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isIn
                ? {
                    // in: 한참 작은 점이다가 끝에서 폭발하며 도착
                    scale: [0, 0.3, 0.8, 4, 22],
                    opacity: [0, 0.4, 0.7, 1, 0],
                  }
                : {
                    scale: [0, 1.5, 4, 12, 22],
                    opacity: [0, 1, 1, 0.85, 0],
                  }
            }
            transition={{
              duration: 1.05,
              times: isIn ? [0, 0.2, 0.55, 0.85, 1] : [0, 0.2, 0.55, 0.85, 1],
              ease: [0.32, 0, 0.18, 1],
            }}
          />

          {/* 워프 스트릭들 */}
          <div className="absolute inset-0">
            {streaks.map((s, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  width: s.thickness,
                  height: s.length,
                  background:
                    "linear-gradient(180deg, rgba(255, 250, 230, 0) 0%, rgba(255, 250, 230, 0.95) 35%, rgba(255, 220, 170, 0.7) 70%, rgba(255, 200, 140, 0) 100%)",
                  transformOrigin: "50% 0%",
                  transform: `translate(-50%, 0) rotate(${s.angle}deg)`,
                  filter: "blur(0.4px)",
                }}
                initial={{ scaleY: isIn ? 1.3 : 0, opacity: 0 }}
                animate={
                  isIn
                    ? {
                        // in: 외곽에서 시작해 점점 짧아지며 중심으로 응축
                        scaleY: [1.3, 1, 0.4, 0.05, 0],
                        opacity: [0, 0.85, 1, 0.7, 0],
                      }
                    : {
                        // out: 중심에서 시작해 길어지며 사방으로 폭발
                        scaleY: [0, 1, 1.3],
                        opacity: [0, 1, 0.7, 0],
                      }
                }
                transition={{
                  duration: s.speed,
                  delay: 0.05 + s.delay,
                  times: isIn ? [0, 0.25, 0.55, 0.85, 1] : [0, 0.5, 0.8, 1],
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </div>

          {/* 마지막 흰빛 폭발 */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255, 248, 225, 0.95) 0%, rgba(255, 220, 170, 0.5) 30%, transparent 70%)",
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={
              isIn
                ? {
                    // in: 끝에서 강한 흰빛 폭발 (도착 모먼트)
                    opacity: [0, 0, 0.2, 0.95, 0],
                    scale: [0.2, 0.3, 0.5, 1.6, 3],
                  }
                : {
                    opacity: [0, 0, 0.4, 0.95, 0],
                    scale: [0.4, 0.6, 1.2, 2.2, 3],
                  }
            }
            transition={{
              duration: 1.05,
              times: isIn ? [0, 0.4, 0.7, 0.9, 1] : [0, 0.3, 0.6, 0.85, 1],
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
