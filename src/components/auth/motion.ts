"use client";

import { useReducedMotion } from "motion/react";
import { EASE_IN, EASE_OUT } from "@/lib/variants";

// Shared motion for the auth screens, and how it honours reduced motion.

// Reduced motion: MotionConfig drops movement but would still play the fades
// (and blurs), so things half-fade without moving, which reads as broken. So
// with reduced motion every animation runs in zero time instead: the new thing
// is simply there, the old one simply gone.
//
// Only the timing changes, never the start/end values: the server can't know
// the OS setting, so it renders the normal starting styles, and if the client
// rendered different ones React would keep the server's (e.g. stuck at
// opacity 0, invisible) and flag a hydration mismatch.
type MotionProps = {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
};

const NO_TIME = { duration: 0, delay: 0 };

// The same props with every transition (including per-target ones inside
// animate/exit) made instant
export function instant<T extends MotionProps>(props: T): T {
  const zero = (target: unknown) =>
    target && typeof target === "object"
      ? { ...target, transition: NO_TIME }
      : target;
  return {
    ...props,
    animate: zero(props.animate),
    exit: zero(props.exit),
    transition: NO_TIME,
  };
}

// `normal` motion props, or the same made instant with reduced motion
export function useSwapMotion<T extends MotionProps>(normal: T): T {
  return useReducedMotion() ? instant(normal) : normal;
}

// Buttons swapping in the slot under the field: they rise in from below and
// sink back down on the way out (exit is the entry reversed).
// In: the rise overshoots a touch, then decelerates softly into place
// (ease-out-back bezier); the fade eases out. Out: both ease in (slow start,
// then away), no bounce.
const EASE_OUT_BACK = [0.34, 1.56, 0.64, 1] as const;
const slotButtonMotion = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      y: { duration: 0.5, ease: EASE_OUT_BACK },
      opacity: { duration: 0.25, ease: EASE_OUT },
    },
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: 0.2, ease: EASE_IN },
  },
};

// The slot buttons' enter/exit, honouring reduced motion
export function useSlotButtonMotion() {
  return useSwapMotion(slotButtonMotion);
}
