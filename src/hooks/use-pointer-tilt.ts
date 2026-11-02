"use client";

import {
  type SpringOptions,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { type RefObject, useEffect } from "react";

type PointerTiltOptions = {
  // Follow the cursor only while true; settles back flat otherwise
  enabled: boolean;
  // Cursor distance (px) from the centre that gives full tilt
  range: number;
  // Rotation (deg) at full tilt
  max: number;
  spring: SpringOptions;
  // Horizontal centre (px from the element's left edge), when the visible thing
  // isn't the element's full width. Defaults to half its width.
  centreX?: number;
};

/**
 * Tilts towards the cursor anywhere on the page. `tiltX`/`tiltY` are the sprung
 * cursor position in -1..1 (for effects driven off the tilt, like glare);
 * `rotateX`/`rotateY` are ready to pass to `style`.
 *
 * `ref` should be an element that doesn't itself rotate, so the tilt can't feed
 * back into the measurement.
 */
export function usePointerTilt(
  ref: RefObject<HTMLElement | null>,
  { enabled, range, max, spring, centreX }: PointerTiltOptions,
) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const tiltX = useSpring(cursorX, spring);
  const tiltY = useSpring(cursorY, spring);
  const rotateY = useTransform(tiltX, (v) => v * max);
  const rotateX = useTransform(tiltY, (v) => -v * max);

  useEffect(() => {
    const reset = () => {
      cursorX.set(0);
      cursorY.set(0);
    };
    if (!enabled) return reset();

    // The centre in page coordinates. Measured up front rather than per move, so
    // pointermove never forces a layout; page coordinates stay valid while scrolling.
    let originX = 0;
    let originY = 0;
    const measure = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      originX = rect.left + window.scrollX + (centreX ?? rect.width / 2);
      originY = rect.top + window.scrollY + rect.height / 2;
    };
    measure();

    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const handleMove = (e: PointerEvent) => {
      cursorX.set(clamp((e.pageX - originX) / range));
      cursorY.set(clamp((e.pageY - originY) / range));
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("resize", measure);
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("resize", measure);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, [enabled, range, centreX, ref, cursorX, cursorY]);

  return { tiltX, tiltY, rotateX, rotateY };
}
