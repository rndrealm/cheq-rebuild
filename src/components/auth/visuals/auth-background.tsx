"use client";

import { useEffect, useRef, useState } from "react";
import {
  Canvas,
  extend,
  useFrame,
  useThree,
  type ThreeElement,
} from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import { Vector2 } from "three";
import Image from "next/image";
import { cn } from "@/lib/utils";
import vertexShader from "@/shaders/auth-background/vertex.glsl";
import fragmentShader from "@/shaders/auth-background/fragment.glsl";
import circlesFragmentShader from "@/shaders/auth-background/fragment-circles.glsl";

// How long a one-stage change takes, end to end.
const TRANSITION_SECONDS = 1.8;
// A change spanning several stages (sign in goes colour -> grey, skipping
// "lowered") takes this much longer per extra stage, rather than the full
// TRANSITION_SECONDS each, so it doesn't drag.
const EXTRA_STAGE_SECONDS = 0.9;

// Speed (progress per second) for a change of `distance` stages
const speedFor = (distance: number) =>
  distance /
  (TRANSITION_SECONDS + Math.max(0, distance - 1) * EXTRA_STAGE_SECONDS);

// - colour: the colour blobs (Figma email frame)
// - lowered: the same blobs, lowered (Figma username / password frames)
// - grey: black blobs on white, a grey wash
// (The shaders also have a stage 3, flat black, that no screen uses now.)
export type AuthTone = "colour" | "lowered" | "grey";

const TONE_PROGRESS: Record<AuthTone, number> = {
  colour: 0,
  lowered: 1,
  grey: 2,
};

// Two takes on the background transitions, kept side by side to compare. Both
// lower the blobs for the password step; they differ from there:
// - "front": each change spreads from the logo along a noisy edge, with a swirl
// - "circles": each change is carried by the circles, one after another (each
//   recolours and glides to its new spot)
export type AuthBackgroundVariant = "front" | "circles";

// Page-load entrance: the circles grow and land in place ("circles" variant;
// "front" ignores it and starts settled)
const INTRO_SECONDS = 1.6;
// If WebGL isn't up by then, show the static backdrop instead
const FALLBACK_AFTER_MS = 1000;
// How long the error context takes to come in or clear ("circles" variant;
// "front" ignores it)
const ERROR_SECONDS = 1;
// How long the circles take to merge into white ("circles" variant)
const WHITE_SECONDS = 1.6;

const uniforms = () => ({
  uResolution: new Vector2(1, 1),
  uProgress: 0,
  uIntro: 0,
  uError: 0,
  uWhite: 0,
});

// Moves `value` towards `target` by at most `step`
const approach = (value: number, target: number, step: number) =>
  target > value ? Math.min(target, value + step) : Math.max(target, value - step);
const AuthBackgroundMaterial = shaderMaterial(
  uniforms(),
  vertexShader,
  fragmentShader,
);
const AuthCirclesMaterial = shaderMaterial(
  uniforms(),
  vertexShader,
  circlesFragmentShader,
);
extend({ AuthBackgroundMaterial, AuthCirclesMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    authBackgroundMaterial: ThreeElement<
      typeof AuthBackgroundMaterial
    >;
    authCirclesMaterial: ThreeElement<typeof AuthCirclesMaterial>;
  }
}

function BackgroundPlane({
  tone,
  variant,
  error,
  white,
}: {
  tone: AuthTone;
  variant: AuthBackgroundVariant;
  error: boolean;
  white: boolean;
}) {
  const materialRef =
    useRef<InstanceType<typeof AuthBackgroundMaterial>>(null);
  const invalidate = useThree((state) => state.invalidate);
  const reducedMotion = useReducedMotion();
  // Set when the target changes, from how far there is to go
  const speedRef = useRef(speedFor(1));
  // The first frame starts at the page's first tone rather than animating to
  // it from colour (only later changes animate)
  const startedRef = useRef(false);

  // The canvas only renders on demand; kick it when the target changes.
  useEffect(() => {
    const current = materialRef.current?.uProgress ?? 0;
    speedRef.current = speedFor(
      Math.max(1, Math.abs(TONE_PROGRESS[tone] - current)),
    );
    invalidate();
  }, [tone, invalidate]);

  useEffect(() => {
    invalidate();
  }, [error, white, invalidate]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uResolution.set(state.size.width, state.size.height);

    const target = TONE_PROGRESS[tone];
    if (!startedRef.current) {
      startedRef.current = true;
      material.uProgress = target;
    }
    const errorTarget = error ? 1 : 0;
    const whiteTarget = white ? 1 : 0;
    if (reducedMotion) {
      material.uIntro = 1;
      material.uProgress = target;
      material.uError = errorTarget;
      material.uWhite = whiteTarget;
      return;
    }

    // Clamp delta: in demand mode the first frame after idling sees the whole
    // idle time as its delta.
    const dt = Math.min(delta, 1 / 30);

    // Plays once, from the first frame (i.e. as soon as WebGL is up)
    material.uIntro = Math.min(1, material.uIntro + dt / INTRO_SECONDS);

    material.uProgress = approach(
      material.uProgress,
      target,
      dt * speedRef.current,
    );
    material.uError = approach(material.uError, errorTarget, dt / ERROR_SECONDS);
    material.uWhite = approach(material.uWhite, whiteTarget, dt / WHITE_SECONDS);

    if (
      material.uIntro < 1 ||
      material.uProgress !== target ||
      material.uError !== errorTarget ||
      material.uWhite !== whiteTarget
    ) {
      state.invalidate();
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      {variant === "circles" ? (
        <authCirclesMaterial ref={materialRef} />
      ) : (
        <authBackgroundMaterial ref={materialRef} />
      )}
    </mesh>
  );
}

/**
 * Full-bleed auth backdrop: a shader that plays the circles' entrance on
 * load, then morphs between the tones (colour -> lowered -> grey)
 * as `tone` changes. `variant` picks how those changes play (see above).
 *
 * The static colour SVG is only a fallback: shown if WebGL hasn't started
 * within FALLBACK_AFTER_MS (it would otherwise flash the finished circles
 * before the entrance grows them in).
 */
export function AuthBackground({
  tone,
  variant = "front",
  error = false,
  white = false,
}: {
  tone: AuthTone;
  variant?: AuthBackgroundVariant;
  // Turns the circles into the red error context ("circles" variant)
  error?: boolean;
  // Merges the circles into a plain white page ("circles" variant)
  white?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), FALLBACK_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className={cn(
          "absolute top-[-950px] left-[calc(50%-18px)] h-[2589px] w-[3164px] -translate-x-1/2 opacity-0 transition-opacity duration-500 motion-reduce:transition-none",
          slow && !ready && "opacity-100",
        )}
      >
        <Image
          src="/media/auth/background-blobs.svg"
          alt=""
          width={3164}
          height={2589}
          priority
          unoptimized
          className="block size-full max-w-none"
        />
      </div>

      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 motion-reduce:transition-none",
          ready && "opacity-100",
        )}
      >
        <Canvas
          frameloop="demand"
          dpr={[1, 2]}
          flat
          gl={{ antialias: false }}
          onCreated={() => setReady(true)}
        >
          <BackgroundPlane
            tone={tone}
            variant={variant}
            error={error}
            white={white}
          />
        </Canvas>
      </div>
    </div>
  );
}
