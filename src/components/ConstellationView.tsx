"use client";

import { motion } from "framer-motion";
import { resolveStar } from "@/lib/store";
import { mstEdges, placeConstellation } from "@/lib/constellation";
import { StarPoint } from "./StarPoint";

interface Props {
  starIds: string[];
  onTap?: (starId: string) => void;
  emptyMessage?: string;
}

function edgeHash(a: number, b: number, salt: number): number {
  let h = ((a + 1) * 73856093) ^ ((b + 1) * 19349663) ^ (salt * 83492791);
  h = h | 0;
  return ((h % 2000) - 1000) / 1000;
}

export function ConstellationView({ starIds, onTap, emptyMessage }: Props) {
  const valid = starIds.filter((id) => resolveStar(id));
  const placed = placeConstellation(valid);
  const edges = mstEdges(placed);

  if (placed.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center px-12">
        <p className="label-kr-bright text-center">
          {emptyMessage ?? "오늘은 아직 마주친 별이 없어요"}
        </p>
      </div>
    );
  }

  const lengths = edges.map(([a, b]) =>
    Math.hypot(placed[a].x - placed[b].x, placed[a].y - placed[b].y),
  );
  const maxLen = Math.max(0.001, ...lengths);

  return (
    <div className="absolute inset-0">
      {edges.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            {edges.map(([a, b], i) => {
              const pa = placed[a];
              const pb = placed[b];
              const t = lengths[i] / maxLen;
              // 길이가 길수록 더 흐리게 (0.07 ~ 0.18)
              const baseAlpha = 0.18 - t * 0.1;
              return (
                <linearGradient
                  key={i}
                  id={`line-${i}`}
                  x1={pa.x * 100}
                  y1={pa.y * 100}
                  x2={pb.x * 100}
                  y2={pb.y * 100}
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="rgba(245, 231, 196, 0)" />
                  <stop
                    offset="22%"
                    stopColor={`rgba(245, 231, 196, ${baseAlpha.toFixed(3)})`}
                  />
                  <stop
                    offset="78%"
                    stopColor={`rgba(245, 231, 196, ${baseAlpha.toFixed(3)})`}
                  />
                  <stop offset="100%" stopColor="rgba(245, 231, 196, 0)" />
                </linearGradient>
              );
            })}
          </defs>

          {edges.map(([a, b], i) => {
            const pa = placed[a];
            const pb = placed[b];
            const x1 = pa.x * 100;
            const y1 = pa.y * 100;
            const x2 = pb.x * 100;
            const y2 = pb.y * 100;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const bow = edgeHash(a, b, 1);
            const cx = (x1 + x2) / 2 + dy * 0.06 * bow;
            const cy = (y1 + y2) / 2 - dx * 0.06 * bow;

            const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
            return (
              <motion.path
                key={i}
                d={path}
                stroke={`url(#line-${i})`}
                strokeWidth={0.7}
                fill="none"
                strokeLinecap="round"
                style={{ vectorEffect: "non-scaling-stroke" }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  delay: 0.5 + i * 0.09,
                  duration: 1.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            );
          })}
        </svg>
      )}
      {placed.map((p, i) => {
        const meta = resolveStar(p.starId)!;
        const warm = meta.scope !== "global";
        const size = Math.round(4 + p.magnitude * 3);
        const intensity =
          p.magnitude > 1.1 ? "bright" : p.magnitude > 0.9 ? "medium" : "soft";
        return (
          <div
            key={p.starId}
            className="absolute"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          >
            <motion.button
              onClick={() => onTap?.(p.starId)}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: i * 0.08,
                duration: 0.9,
                ease: [0.19, 1, 0.22, 1],
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 active:scale-95 transition-transform group"
              style={{ width: size, height: size }}
              aria-label={meta.title}
            >
              <StarPoint size={size} warm={warm} twinkle intensity={intensity} />
            </motion.button>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.6 }}
              className="absolute -translate-x-1/2 whitespace-nowrap pointer-events-none text-[11px] text-fg/70 font-light tracking-tight"
              style={{ top: size / 2 + 10 }}
            >
              {meta.title}
            </motion.span>
          </div>
        );
      })}
    </div>
  );
}
