'use client';

import { useEffect, useId, useRef } from 'react';
import { animate } from 'motion/react';
import {
  COLORS,
  FRAME_D,
  FACE_D,
  PATHS,
  IDLE_ANIMATIONS,
} from '@/lib/avatar-shapes';

interface AvatarProps {
  expressionIndex?: number;
  colorIndex?: number;
  size?: number;
  className?: string;
}

export function Avatar({
  expressionIndex = 2,
  colorIndex = 2,
  size = 40,
  className,
}: AvatarProps) {
  const uid = useId();
  const leftRef = useRef<SVGPathElement>(null);
  const rightRef = useRef<SVGPathElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const prevExprRef = useRef(expressionIndex);
  const stopRef = useRef<(() => void) | null>(null);

  const color = COLORS[colorIndex] ?? COLORS[0];

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
      options: { duration: number; times?: number[]; repeat?: number; ease?: 'linear' }
    ) =>
      animate(el.getAttribute('d') ?? '', keyframes, {
        ...options,
        onUpdate: (d) => el.setAttribute('d', d),
      });

    const startIdle = () => {
      const idleOptions = {
        duration: idle.duration,
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
      void Promise.all([cL, cR, cM]).then(startIdle);
    } else {
      left.setAttribute('d', newPaths.left);
      right.setAttribute('d', newPaths.right);
      mouth.setAttribute('d', newPaths.mouth);
      startIdle();
    }

    return () => {
      if (stopRef.current) {
        stopRef.current();
        stopRef.current = null;
      }
    };
  }, [expressionIndex]);

  const fillId = `avatar-fill${uid}`;
  const borderId = `avatar-border${uid}`;

  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className}>
      <defs>
        <linearGradient id={fillId} x1="20" x2="20" y1="-3" y2="40" gradientUnits="userSpaceOnUse">
          <stop
            offset="0.299"
            style={{ stopColor: color.gradientFrom, transition: 'stop-color 250ms ease' }}
          />
          <stop
            offset="1"
            style={{ stopColor: color.gradientTo, transition: 'stop-color 250ms ease' }}
          />
        </linearGradient>
        <linearGradient
          id={borderId}
          x1="20"
          x2="20"
          y1="54.5"
          y2="-5"
          gradientUnits="userSpaceOnUse"
        >
          <stop style={{ stopColor: color.borderTo }} />
          <stop offset="1" style={{ stopColor: color.borderFrom }} />
        </linearGradient>
      </defs>
      <rect
        width="39"
        height="39"
        x="0.5"
        y="0.5"
        rx="9.5"
        style={{ fill: color.bg, transition: 'fill 250ms ease 80ms' }}
      />
      <rect
        width="39"
        height="39"
        x="0.5"
        y="0.5"
        fill="none"
        stroke={`url(#${borderId})`}
        rx="9.5"
      />
      <path d={FRAME_D} fill={`url(#${fillId})`} />
      <path d={FACE_D} style={{ fill: color.bg, transition: 'fill 250ms ease 40ms' }} />
      <path ref={leftRef} fill={`url(#${fillId})`} />
      <path ref={rightRef} fill={`url(#${fillId})`} />
      <path ref={mouthRef} fill={`url(#${fillId})`} />
    </svg>
  );
}
