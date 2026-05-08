"use client";

import type { CSSProperties } from "react";

interface Props {
  size?: number;
  warm?: boolean;
  twinkle?: boolean;
  intensity?: "soft" | "medium" | "bright";
  style?: CSSProperties;
}

export function StarPoint({
  size = 5,
  warm = false,
  twinkle = false,
  intensity = "medium",
  style,
}: Props) {
  const core = warm ? "rgb(255, 220, 175)" : "rgb(248, 246, 232)";
  const halo1 = warm ? "rgba(255, 195, 130, 0.85)" : "rgba(232, 232, 222, 0.85)";
  const halo2 = warm ? "rgba(220, 130, 70, 0.45)" : "rgba(190, 190, 230, 0.45)";
  const halo3 = warm ? "rgba(180, 90, 50, 0.22)" : "rgba(150, 165, 220, 0.22)";

  const spread =
    intensity === "soft"
      ? [3, 8, 16]
      : intensity === "bright"
      ? [6, 16, 36]
      : [4, 12, 26];

  return (
    <span
      aria-hidden
      className={`relative inline-block ${twinkle ? "twinkle" : ""}`}
      style={{ width: size, height: size, ...style }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: core,
          boxShadow: `0 0 ${spread[0]}px ${halo1}, 0 0 ${spread[1]}px ${halo2}, 0 0 ${spread[2]}px ${halo3}`,
        }}
      />
    </span>
  );
}
