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
  // r3f Canvas의 inline style(position:relative, width/height 100%) 때문에
  // 부모가 flex 컨테이너이면 backdrop 가 flex 영역 전체를 먹는 버그가 있음.
  // absolute 래퍼로 감싸 flex flow 밖으로 분리.
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden={!interactive}
    >
      <Nebula variant={variant} />
      <CosmosThree
        density={density}
        drift={drift}
        interactive={interactive}
        constellation={constellation}
      />
      <div aria-hidden className="absolute inset-0 grain pointer-events-none" />
    </div>
  );
}

export function CosmosLite({ density = 0.5 }: { density?: number }) {
  return <CosmosThree density={density} drift={0.4} />;
}
