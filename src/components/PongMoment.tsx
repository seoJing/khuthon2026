"use client";

import { AnimatePresence, motion } from "framer-motion";

export function PongMoment({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            key="flash"
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,240,200,0.6) 30%, transparent 70%)",
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 1.6] }}
            transition={{ duration: 0.4, times: [0, 0.4, 1] }}
          />
          <motion.div
            key="plus1"
            className="absolute top-7 right-7 z-40 pointer-events-none text-white text-[22px] font-extralight tracking-tight"
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.15, 1, 1], y: [-2, -8, -14, -22] }}
            transition={{ duration: 0.7, times: [0, 0.2, 0.6, 1] }}
            style={{
              textShadow:
                "0 0 12px rgba(255, 240, 200, 0.8), 0 0 28px rgba(255, 220, 160, 0.5)",
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
  const N = 18;
  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {Array.from({ length: N }).map((_, i) => {
        const angle = (i / N) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 140 + Math.random() * 120;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const size = 2 + Math.random() * 2;
        const warm = Math.random() > 0.5;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              background: warm ? "rgb(255, 230, 180)" : "rgb(255, 255, 255)",
              boxShadow: warm
                ? "0 0 8px rgba(255,200,140,0.9), 0 0 18px rgba(255,180,100,0.5)"
                : "0 0 8px rgba(255,255,255,0.9), 0 0 18px rgba(220,220,255,0.5)",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.55 + Math.random() * 0.15, ease: [0.19, 1, 0.22, 1] }}
          />
        );
      })}
    </div>
  );
}
