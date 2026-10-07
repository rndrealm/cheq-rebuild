"use client";
import React, { Fragment, useRef } from "react";
import {
  Canvas,
  extend,
  useFrame,
  type ThreeElement,
} from "@react-three/fiber";
import { OrbitControls, shaderMaterial, Stats } from "@react-three/drei";
import { Leva, useControls } from "leva";
import { easing } from "maath";
import { Color, DoubleSide } from "three";
import vertexShader from "@/shaders/gradient-noise/vertex.glsl";
import fragmentShader from "@/shaders/gradient-noise/fragment.glsl";
import type { BetDirection } from "@/components/token-card/bet-dialog";

const CardMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new Color("#e09442"),
    uColor2: new Color("#789e71"),
    uColor3: new Color("#000000"),
    uColorB1: new Color("#1130ee"),
    uColorB2: new Color("#6011ee"),
    uColorB3: new Color("#119fee"),
    uColorC1: new Color("#1cb9e3"),
    uColorC2: new Color("#1a55e5"),
    uColorC3: new Color("#1ee1ad"),
    uColorProgress: 1,
    uColorProgressC: 0,
    uLines: 30,
    uOffset1: 0.5,
    uOffset2: 0.1,
  },
  vertexShader,
  fragmentShader,
);
extend({ CardMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    cardMaterial: ThreeElement<typeof CardMaterial>;
  }
}

// The shader mixes A -> B by uColorProgress, then that result -> C by uColorProgressC.
const COLOR_TARGETS: Record<
  "up" | "down" | "none",
  { progress: number; progressC: number }
> = {
  none: { progress: 1, progressC: 0 }, // B
  up: { progress: 1, progressC: 1 }, // C
  down: { progress: 0, progressC: 0 }, // A
};

function Experience({ direction }: { direction: BetDirection }) {
  const materialRef = useRef<InstanceType<typeof CardMaterial>>(null);

  const { color1, color2, color3 } = useControls("Colors", {
    color1: "#f8aa07",
    color2: "#06f9a5",
    color3: "#FF3C83",
  });

  const { colorB1, colorB2, colorB3 } = useControls("Colors B", {
    colorB1: "#1130ee",
    colorB2: "#6011ee",
    colorB3: "#119fee",
  });

  const { colorC1, colorC2, colorC3 } = useControls("Colors C", {
    colorC1: "#1cb9e3",
    colorC2: "#1a55e5",
    colorC3: "#1ee1ad",
  });

  const { lines, offset1, offset2 } = useControls("Pattern", {
    lines: { value: 36, min: 1, max: 100, step: 1 },
    offset1: { value: 0.5, min: 0, max: 1, step: 0.01 },
    offset2: { value: 0.1, min: 0, max: 1, step: 0.01 },
  });

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;
    material.uTime = state.clock.elapsedTime;

    const target = COLOR_TARGETS[direction ?? "none"];
    easing.damp(material, "uColorProgress", target.progress, 1, delta);
    easing.damp(material, "uColorProgressC", target.progressC, 1, delta);
  });

  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <cardMaterial
        ref={materialRef}
        side={DoubleSide}
        uColor1={color1}
        uColor2={color2}
        uColor3={color3}
        uColorB1={colorB1}
        uColorB2={colorB2}
        uColorB3={colorB3}
        uColorC1={colorC1}
        uColorC2={colorC2}
        uColorC3={colorC3}
        uLines={lines}
        uOffset1={offset1}
        uOffset2={offset2}
      />
    </mesh>
  );
}

export function Webgl({ direction }: { direction: BetDirection }) {
  return (
    <Fragment>
      <Leva hidden />
      <Canvas camera={{ position: [0, 0, 1.5] }}>
        {/* <Stats /> */}
        <Experience direction={direction} />
        {/* <OrbitControls /> */}
      </Canvas>
    </Fragment>
  );
}
