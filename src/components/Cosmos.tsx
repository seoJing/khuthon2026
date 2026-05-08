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

interface ConstellationData {
  starIds: string[];
  onTap?: (starId: string) => void;
}

interface BackdropProps {
  density?: number;
  drift?: number;
  variant?: "deep" | "soft" | "warm";
  interactive?: boolean;
  constellation?: ConstellationData;
}

export function CosmicBackdrop({
  density = 1,
  drift = 1,
  variant = "deep",
  interactive = false,
  constellation,
}: BackdropProps) {
  return (
    <>
      <Nebula variant={variant} />
      <CosmosThree
        density={density}
        drift={drift}
        interactive={interactive}
        constellation={constellation}
      />
      <div aria-hidden className="absolute inset-0 grain pointer-events-none" />
    </>
  );
}

export function CosmosLite({ density = 0.5 }: { density?: number }) {
  return <CosmosThree density={density} drift={0.4} />;
}
