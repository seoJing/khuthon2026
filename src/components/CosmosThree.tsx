"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls, Html } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

let CACHED_STAR_TEX: THREE.CanvasTexture | null = null;
import {
  mstEdges,
  placeConstellation,
  type PlacedStar,
} from "@/lib/constellation";
import { resolveStar } from "@/lib/store";

const SCALE = 1.8; // [0,1] 정규 → [-0.9, 0.9] 3D

function StarsLayers({ density }: { density: number }) {
  return (
    <>
      <Stars
        radius={160}
        depth={90}
        count={Math.floor(2400 * density)}
        factor={2.6}
        saturation={0.35}
        fade
        speed={0.18}
      />
      <Stars
        radius={85}
        depth={55}
        count={Math.floor(750 * density)}
        factor={3.6}
        saturation={0.55}
        fade
        speed={0.45}
      />
      <Stars
        radius={42}
        depth={22}
        count={Math.floor(140 * density)}
        factor={5.5}
        saturation={0.75}
        fade
        speed={0.85}
      />
    </>
  );
}

/**
 * 진짜 별 텍스처 — 4개 주 회절 스파이크 + 4개 대각 보조 스파이크 + 헤일로 + 작은 핵.
 * Hubble 사진처럼 보이도록 설계.
 * 흰색 단일 텍스처. 색은 spriteMaterial.color 로 tint.
 */
function makeStarTexture(): THREE.CanvasTexture {
  if (CACHED_STAR_TEX) return CACHED_STAR_TEX;
  const SIZE = 256;
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const ctx = c.getContext("2d")!;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  ctx.clearRect(0, 0, SIZE, SIZE);

  // 1. 가장 바깥 헤일로 — 매우 옅음, 큰 반경
  const outerHalo = ctx.createRadialGradient(cx, cy, 0, cx, cy, SIZE * 0.5);
  outerHalo.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  outerHalo.addColorStop(0.25, "rgba(255, 255, 255, 0.06)");
  outerHalo.addColorStop(0.6, "rgba(255, 255, 255, 0.015)");
  outerHalo.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = outerHalo;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 이후 layer는 additive
  ctx.globalCompositeOperation = "lighter";

  // 2. 회절 스파이크 그리기 함수 (양방향 삼각형)
  const drawSpike = (
    angle: number,
    length: number,
    width: number,
    alpha: number,
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.08, `rgba(255, 255, 255, ${alpha * 0.85})`);
    grad.addColorStop(0.4, `rgba(255, 255, 255, ${alpha * 0.18})`);
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -width);
    ctx.lineTo(length, 0);
    ctx.lineTo(0, width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const mainLen = SIZE * 0.5;
  const diagLen = SIZE * 0.22;

  // 메인 4 스파이크 (수직·수평) — 길고 또렷
  for (let i = 0; i < 4; i++) {
    drawSpike((i * Math.PI) / 2, mainLen, 1.4, 0.7);
  }
  // 대각 4 스파이크 — 짧고 옅음
  for (let i = 0; i < 4; i++) {
    drawSpike(Math.PI / 4 + (i * Math.PI) / 2, diagLen, 0.9, 0.22);
  }

  // 3. 내부 글로우 — 핵 주변 부드러운 빛
  const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, SIZE * 0.16);
  innerGlow.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  innerGlow.addColorStop(0.3, "rgba(255, 255, 255, 0.35)");
  innerGlow.addColorStop(0.7, "rgba(255, 255, 255, 0.08)");
  innerGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = innerGlow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 4. 핵 — 아주 작고 또렷, 거의 saturated
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, SIZE * 0.04);
  core.addColorStop(0, "rgba(255, 255, 255, 1)");
  core.addColorStop(0.5, "rgba(255, 255, 255, 0.7)");
  core.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  CACHED_STAR_TEX = tex;
  return tex;
}

function StarSprite({
  position,
  size,
  warm,
  label,
  twinklePhase,
  twinkleSpeed,
  onClick,
}: {
  position: [number, number, number];
  size: number;
  warm: boolean;
  label: string;
  twinklePhase: number;
  twinkleSpeed: number;
  onClick?: () => void;
}) {
  const texture = useMemo(() => makeStarTexture(), []);
  const matRef = useRef<THREE.SpriteMaterial>(null);
  const spriteRef = useRef<THREE.Sprite>(null);

  // 별 색온도 — 따뜻색은 K형(주황빛), 차가운색은 A/F형(청백)
  const tint = warm ? "#ffce8a" : "#dde5f5";

  useFrame((state) => {
    if (!matRef.current || !spriteRef.current) return;
    const t = state.clock.elapsedTime;

    // 다중 주파수 합성 — 단조롭지 않은 자연스러운 반짝임
    const slow =
      Math.sin(t * twinkleSpeed * 0.65 + twinklePhase) * 0.5 + 0.5;
    const fast =
      Math.sin(t * twinkleSpeed * 3.4 + twinklePhase * 1.7) * 0.5 + 0.5;
    const combined = slow * 0.62 + fast * 0.38;

    // 밝기 — 0.55 ~ 1.0
    matRef.current.opacity = 0.55 + combined * 0.45;

    // 미세 스케일 펄스 — ±3.5%, 깜빡임과 약간 다른 위상
    const scalePulse =
      1 + Math.sin(t * twinkleSpeed * 2.3 + twinklePhase + 0.3) * 0.035;
    spriteRef.current.scale.set(size * scalePulse, size * scalePulse, 1);

    // 회절 스파이크 미세 회전 — ±0.045 rad, 빛이 떨리는 느낌
    spriteRef.current.material.rotation =
      Math.sin(t * 0.2 + twinklePhase) * 0.045;
  });

  return (
    <group position={position}>
      <sprite
        ref={spriteRef}
        scale={[size, size, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <spriteMaterial
          ref={matRef}
          map={texture}
          color={tint}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <Html
        center
        position={[0, -size * 0.55 - 0.04, 0]}
        distanceFactor={5}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <span
          className="font-light tracking-tight whitespace-nowrap"
          style={{
            fontSize: 11,
            color: "rgba(243, 240, 234, 0.65)",
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </span>
      </Html>
    </group>
  );
}

function edgeBow(a: number, b: number, idx: number): number {
  const h =
    ((a + 1) * 73856093) ^ ((b + 1) * 19349663) ^ ((idx + 1) * 83492791);
  return (((h | 0) % 2000) - 1000) / 1000;
}

function ConstellationLines({
  placed,
  edges,
}: {
  placed: PlacedStar[];
  edges: [number, number][];
}) {
  const geometry = useMemo(() => {
    const SEG = 24;
    const positions: number[] = [];
    const colors: number[] = [];

    edges.forEach(([a, b], idx) => {
      const pa = placed[a];
      const pb = placed[b];
      const ax = (pa.x - 0.5) * SCALE;
      const ay = -(pa.y - 0.5) * SCALE;
      const az = pa.z;
      const bx = (pb.x - 0.5) * SCALE;
      const by = -(pb.y - 0.5) * SCALE;
      const bz = pb.z;

      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const bow = edgeBow(a, b, idx);
      const cx = (ax + bx) / 2 + (-dy / len) * len * 0.08 * bow;
      const cy = (ay + by) / 2 + (dx / len) * len * 0.08 * bow;
      const cz = (az + bz) / 2;

      const baseBrightness = Math.max(
        0.3,
        0.95 - (len / SCALE) * 0.4,
      );

      const samples: { x: number; y: number; z: number; alpha: number }[] = [];
      for (let i = 0; i < SEG; i++) {
        const tt = i / (SEG - 1);
        const u = 1 - tt;
        const px = u * u * ax + 2 * u * tt * cx + tt * tt * bx;
        const py = u * u * ay + 2 * u * tt * cy + tt * tt * by;
        const pz = u * u * az + 2 * u * tt * cz + tt * tt * bz;
        let alpha = 1;
        if (tt < 0.22) alpha = tt / 0.22;
        else if (tt > 0.78) alpha = (1 - tt) / 0.22;
        samples.push({ x: px, y: py, z: pz, alpha });
      }

      for (let i = 0; i < SEG - 1; i++) {
        const s1 = samples[i];
        const s2 = samples[i + 1];
        for (const s of [s1, s2]) {
          positions.push(s.x, s.y, s.z);
          const v = baseBrightness * s.alpha * 0.22;
          // accent (0.96, 0.91, 0.77)
          colors.push(0.96 * v, 0.91 * v, 0.77 * v);
        }
      }
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [placed, edges]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

interface ConstellationData {
  starIds: string[];
  onTap?: (starId: string) => void;
}

function Constellation({ starIds, onTap }: ConstellationData) {
  const valid = starIds.filter((id) => resolveStar(id));
  const key = valid.join(",");
  const placed = useMemo(
    () => placeConstellation(valid),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  const edges = useMemo(() => mstEdges(placed), [placed]);

  return (
    <group>
      <ConstellationLines placed={placed} edges={edges} />
      {placed.map((p, i) => {
        const meta = resolveStar(p.starId)!;
        const warm = meta.scope !== "global";
        const size = 0.18 + p.magnitude * 0.13;
        // 별마다 다른 깜빡임 위상·속도 (deterministic)
        const phaseSeed = (p.starId.charCodeAt(0) * 17 + i * 31) % 100;
        const phase = (phaseSeed / 100) * Math.PI * 2;
        const speed = 0.6 + (phaseSeed % 7) * 0.12;
        return (
          <StarSprite
            key={p.starId}
            position={[(p.x - 0.5) * SCALE, -(p.y - 0.5) * SCALE, p.z]}
            size={size}
            warm={warm}
            label={meta.title}
            twinklePhase={phase}
            twinkleSpeed={speed}
            onClick={() => onTap?.(p.starId)}
          />
        );
      })}
    </group>
  );
}

function NonInteractiveScene({
  density,
  drift,
}: {
  density: number;
  drift: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.012 * drift;
      groupRef.current.rotation.x += delta * 0.004 * drift;
    }
    const t = state.clock.getElapsedTime();
    state.camera.position.x = Math.sin(t * 0.08) * 0.25;
    state.camera.position.y = Math.cos(t * 0.06) * 0.18;
    state.camera.lookAt(0, 0, 0);
  });
  return (
    <group ref={groupRef}>
      <StarsLayers density={density} />
    </group>
  );
}

interface Props {
  density?: number;
  drift?: number;
  interactive?: boolean;
  constellation?: ConstellationData;
}

export function CosmosThree({
  density = 1,
  drift = 1,
  interactive = false,
  constellation,
}: Props) {
  const hasConstellation =
    !!constellation && constellation.starIds.length > 0;

  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ position: [0, 0, 3.4], fov: 60, near: 0.1, far: 300 }}
      style={{ pointerEvents: interactive ? "auto" : "none" }}
    >
      {interactive ? (
        <>
          <StarsLayers density={density} />
          {hasConstellation && constellation && (
            <Constellation {...constellation} />
          )}
          <OrbitControls
            enablePan={false}
            minDistance={2.0}
            maxDistance={6.0}
            rotateSpeed={0.5}
            zoomSpeed={0.45}
            enableDamping
            dampingFactor={0.08}
            autoRotate={!hasConstellation}
            autoRotateSpeed={0.18}
            minPolarAngle={Math.PI * 0.22}
            maxPolarAngle={Math.PI * 0.78}
            target={[0, 0, 0]}
          />
        </>
      ) : (
        <NonInteractiveScene density={density} drift={drift} />
      )}
    </Canvas>
  );
}
