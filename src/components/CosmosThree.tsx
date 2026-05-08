"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

interface SceneProps {
  density: number;
  drift: number;
}

function StarsScene({ density, drift }: SceneProps) {
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
    </group>
  );
}

interface Props {
  density?: number;
  drift?: number;
}

export function CosmosThree({ density = 1, drift = 1 }: Props) {
  return (
    <Canvas
      className="absolute inset-0 pointer-events-none"
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ position: [0, 0, 1], fov: 75, near: 0.1, far: 300 }}
    >
      <StarsScene density={density} drift={drift} />
    </Canvas>
  );
}
