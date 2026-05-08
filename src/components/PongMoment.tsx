"use client";

import { AnimatePresence, motion } from "framer-motion";

export function PongMoment({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <>
          {/* 1. 흰 plasma 폭발 */}
          <motion.div
            key="flash"
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,245,210,0.75) 22%, rgba(255,210,150,0.32) 45%, transparent 75%)",
            }}
            initial={{ opacity: 0, scale: 0.25 }}
            animate={{ opacity: [0, 1, 0], scale: [0.25, 1.5, 2.1] }}
            transition={{ duration: 0.6, times: [0, 0.3, 1] }}
          />

          {/* 2. 따뜻한 glow under-layer (screen blend) */}
          <motion.div
            key="warm"
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255, 200, 130, 0.7) 0%, rgba(255, 160, 90, 0.25) 35%, transparent 60%)",
              mixBlendMode: "screen",
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.7, 2.4] }}
            transition={{ duration: 0.75, times: [0, 0.32, 1] }}
          />

          {/* 3. 확장하는 충격파 링 (bright) */}
          <motion.div
            key="ring1"
            className="absolute pointer-events-none z-30 rounded-full"
            style={{
              top: "50%",
              left: "50%",
              translate: "-50% -50%",
              width: 110,
              height: 110,
              border: "2px solid rgba(255, 235, 190, 0.85)",
            }}
            initial={{ opacity: 0, scale: 0.15 }}
            animate={{ opacity: [0, 1, 0], scale: [0.15, 2.6, 4.2] }}
            transition={{ duration: 0.85, times: [0, 0.3, 1], ease: [0.19, 1, 0.22, 1] }}
          />

          {/* 4. 두 번째 링 — 더 가늘고 늦게 */}
          <motion.div
            key="ring2"
            className="absolute pointer-events-none z-30 rounded-full"
            style={{
              top: "50%",
              left: "50%",
              translate: "-50% -50%",
              width: 80,
              height: 80,
              border: "1px solid rgba(245, 231, 196, 0.5)",
            }}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.2, 3.2, 5] }}
            transition={{ duration: 1, delay: 0.12, times: [0, 0.35, 1], ease: [0.19, 1, 0.22, 1] }}
          />

          {/* 5. 화면 가장자리 glow (vignette pulse) */}
          <motion.div
            key="vignette"
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              boxShadow:
                "inset 0 0 80px rgba(255, 230, 180, 0.6), inset 0 0 160px rgba(255, 200, 130, 0.3)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, times: [0, 0.3, 1] }}
          />

          {/* 6. +1 raise */}
          <motion.div
            key="plus1"
            className="absolute top-6 right-6 z-40 pointer-events-none text-white text-[28px] font-extralight tracking-tight"
            initial={{ opacity: 0, scale: 0.5, y: 8 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.25, 1, 1], y: [-2, -12, -20, -36] }}
            transition={{ duration: 0.95, times: [0, 0.2, 0.6, 1] }}
            style={{
              textShadow:
                "0 0 18px rgba(255, 240, 200, 1), 0 0 38px rgba(255, 215, 150, 0.7), 0 0 60px rgba(255, 180, 100, 0.4)",
            }}
          >
            +1
          </motion.div>

          <Particles />
        </>
      )}
    </AnimatePresence>
  );
}

function Particles() {
  const N = 28;
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {Array.from({ length: N }).map((_, i) => {
        const angle = (i / N) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 200 + Math.random() * 200;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const size = 1.5 + Math.random() * 3;
        const warm = Math.random() > 0.35;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              background: warm ? "rgb(255, 232, 180)" : "rgb(255, 255, 255)",
              boxShadow: warm
                ? "0 0 12px rgba(255,200,140,1), 0 0 26px rgba(255,180,100,0.65)"
                : "0 0 12px rgba(255,255,255,1), 0 0 26px rgba(220,220,255,0.65)",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1.3 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.25 }}
            transition={{
              duration: 0.7 + Math.random() * 0.25,
              ease: [0.19, 1, 0.22, 1],
            }}
          />
        );
      })}
    </div>
  );
}
