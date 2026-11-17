'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { IDLE_ANIMATIONS, PATHS } from '@/lib/avatar-shapes';

/**
 * Drives an avatar's eyes and mouth: sets them to `expressionIndex`'s shapes
 * (morphing over 0.4s when it changes) and then loops that expression's idle
 * animation. Attach the returned refs to the eye and mouth paths.
 *
 * `idleDelay` (s) holds off the first idle loop, so avatars shown together
 * don't all blink in unison.
 */
export function useAvatarExpression(
  expressionIndex: number,
  { idleDelay = 0 }: { idleDelay?: number } = {},
) {
  const leftRef = useRef<SVGPathElement>(null);
  const rightRef = useRef<SVGPathElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const prevExprRef = useRef(expressionIndex);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    const mouth = mouthRef.current;
    if (!left || !right || !mouth) return;

    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }

    const newPaths = PATHS[expressionIndex];
    const idle = IDLE_ANIMATIONS[expressionIndex];
    const changed = prevExprRef.current !== expressionIndex;
    prevExprRef.current = expressionIndex;

    // motion 13's animate(el, { d }) doesn't write an SVG path's `d` attribute, so the
    // path strings are tweened as values (every path shares one structure) and set here
    const morph = (
      el: SVGPathElement,
      keyframes: string | string[],
      options: {
        duration: number;
        delay?: number;
        times?: number[];
        repeat?: number;
        ease?: 'linear';
      },
    ) =>
      animate(el.getAttribute('d') ?? '', keyframes, {
        ...options,
        onUpdate: (d) => el.setAttribute('d', d),
      });

    const startIdle = (delay: number) => {
      const idleOptions = {
        duration: idle.duration,
        delay,
        times: idle.times,
        repeat: Infinity,
        ease: 'linear' as const,
      };
      const cL = morph(left, idle.left, idleOptions);
      const cR = morph(right, idle.right, idleOptions);
      stopRef.current = () => {
        cL.stop();
        cR.stop();
      };
    };

    if (changed) {
      const cL = morph(left, newPaths.left, { duration: 0.4 });
      const cR = morph(right, newPaths.right, { duration: 0.4 });
      const cM = morph(mouth, newPaths.mouth, { duration: 0.4 });
      stopRef.current = () => {
        cL.stop();
        cR.stop();
        cM.stop();
      };
      void Promise.all([cL, cR, cM]).then(() => startIdle(0));
    } else {
      left.setAttribute('d', newPaths.left);
      right.setAttribute('d', newPaths.right);
      mouth.setAttribute('d', newPaths.mouth);
      startIdle(idleDelay);
    }

    return () => {
      if (stopRef.current) {
        stopRef.current();
        stopRef.current = null;
      }
    };
  }, [expressionIndex, idleDelay]);

  return { leftRef, rightRef, mouthRef };
}
