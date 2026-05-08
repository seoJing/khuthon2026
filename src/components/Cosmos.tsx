"use client";

import dynamic from "next/dynamic";

const CosmosThree = dynamic(
  () => import("./CosmosThree").then((m) => m.CosmosThree),
  { ssr: false, loading: () => null },
);

export function Nebula({
  variant = "deep",
}: {
  variant?: "deep" | "soft" | "warm";
}) {
  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none nebula nebula-${variant}`}
    />
  );
}

export function CosmicBackdrop({
  density = 1,
  drift = 1,
  variant = "deep",
}: {
  density?: number;
  drift?: number;
  variant?: "deep" | "soft" | "warm";
}) {
  return (
    <>
      <Nebula variant={variant} />
      <CosmosThree density={density} drift={drift} />
      <div aria-hidden className="absolute inset-0 grain pointer-events-none" />
    </>
  );
}

/**
 * 카드 화면처럼 작은 영역에서 가벼운 배경이 필요할 때 사용.
 * 별도 Canvas를 띄워 무겁지 않게.
 */
export function CosmosLite({ density = 0.5 }: { density?: number }) {
  return <CosmosThree density={density} drift={0.4} />;
}
