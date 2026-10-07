"use client";
import { useMemo, useRef } from "react";
import {
  Canvas,
  extend,
  useFrame,
  type ThreeElement,
} from "@react-three/fiber";
import { OrbitControls, shaderMaterial, Stats } from "@react-three/drei";
import { Leva, useControls } from "leva";
import { Color } from "three";
import vertexShader from "@/shaders/example/vertex.glsl";
import fragmentShader from "@/shaders/example/fragment.glsl";

const ExampleMaterial = shaderMaterial(
  { uTime: 0, uColor: new Color("#ff6a3d") },
  vertexShader,
  fragmentShader,
);
extend({ ExampleMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    exampleMaterial: ThreeElement<typeof ExampleMaterial>;
  }
}

function Plane() {
  const ref = useRef<InstanceType<typeof ExampleMaterial>>(null);
  const { color } = useControls({ color: "#ff6a3d" });
  const uColor = useMemo(() => new Color(color), [color]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.uTime += delta;
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2, 64, 64]} />
      <exampleMaterial ref={ref} uColor={uColor} />
    </mesh>
  );
}

export function ExampleCanvas() {
  return (
    <>
      <Leva collapsed />
      <Canvas camera={{ position: [0, 0, 3] }}>
        <Stats />
        <OrbitControls />
        <Plane />
      </Canvas>
    </>
  );
}
