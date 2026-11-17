'use client';

import { useId } from 'react';
import { COLORS, FRAME_D, FACE_D } from '@/lib/avatar-shapes';
import { useAvatarExpression } from '@/hooks/use-avatar-expression';

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
  const { leftRef, rightRef, mouthRef } = useAvatarExpression(expressionIndex);

  const color = COLORS[colorIndex] ?? COLORS[0];

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

/**
 * Just the avatar character in one colour (`currentColor`), with the face cut
 * out so whatever is behind shows through it, and live eyes and mouth. Fills a
 * box the size of the frame (it sits at 4..36 in the 40px avatar).
 */
export function AvatarGlyph({
  expressionIndex = 0,
  idleDelay,
  className,
}: {
  expressionIndex?: number;
  idleDelay?: number;
  className?: string;
}) {
  const uid = useId();
  const maskId = `avatar-glyph-face${uid}`;
  const { leftRef, rightRef, mouthRef } = useAvatarExpression(expressionIndex, {
    idleDelay,
  });

  return (
    <svg viewBox="4 4 32 32" fill="none" className={className}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="4" y="4" width="32" height="32">
          <path d={FRAME_D} fill="white" />
          <path d={FACE_D} fill="black" />
        </mask>
      </defs>
      <rect x="4" y="4" width="32" height="32" fill="currentColor" mask={`url(#${maskId})`} />
      <path ref={leftRef} fill="currentColor" />
      <path ref={rightRef} fill="currentColor" />
      <path ref={mouthRef} fill="currentColor" />
    </svg>
  );
}
