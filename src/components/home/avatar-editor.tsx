"use client";

import { COLORS, EXPRESSIONS, PATHS } from "@/lib/avatar-shapes";
import { cn } from "@/lib/utils";
import { motion, type Transition } from "motion/react";

const CHIP_SPRING: Transition = { type: "spring", stiffness: 300, damping: 25 };
// Chips and swatches grow when selected; the row height fits the largest
const EXPRESSION_SIZE = { idle: 16, active: 26 };
const COLOR_SIZE = { idle: 16, active: 23 };

/**
 * Dark popover for picking the avatar's expression and colour. Rendered from spans
 * (block-styled) as it sits inside the paragraph alongside the inline avatar.
 */
export const AvatarEditor = ({
  expressionIndex,
  colorIndex,
  onExpressionChange,
  onColorChange,
}: {
  expressionIndex: number;
  colorIndex: number;
  onExpressionChange: (index: number) => void;
  onColorChange: (index: number) => void;
}) => (
  // Positioned centred below the avatar, clear of its jumps. The motion span inside
  // does the pop-in, so its transform doesn't fight the centring translate.
  <span className="absolute top-full left-1/2 z-50 block -translate-x-1/2 pt-3">
    <motion.span
      role="dialog"
      aria-label="Customise avatar"
      className="flex origin-top flex-col items-center gap-2.5 rounded-[14px] bg-[#1E1E1E] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
      initial={{ opacity: 0, y: -6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.95 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        role="radiogroup"
        aria-label="Expression"
        className="flex h-6.5 items-center gap-2"
      >
        {EXPRESSIONS.map((expression, i) => {
          const active = i === expressionIndex;
          const size = active ? EXPRESSION_SIZE.active : EXPRESSION_SIZE.idle;
          return (
            <motion.button
              key={expression.key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={expression.label}
              className={cn(
                "cursor-pointer overflow-hidden rounded-[3px] outline-none focus-visible:ring-1 focus-visible:ring-white",
                active ? "bg-[#292929]" : "bg-[#29292980]",
              )}
              initial={false}
              animate={{ width: size, height: size }}
              transition={CHIP_SPRING}
              onClick={() => onExpressionChange(i)}
            >
              {/* Just the eyes, cropped from the 40x40 avatar */}
              <svg viewBox="12 14 16 9" className="block h-full w-full">
                <path d={PATHS[i].left} fill="#ffffff" />
                <path d={PATHS[i].right} fill="#ffffff" />
              </svg>
            </motion.button>
          );
        })}
      </span>

      <span
        role="radiogroup"
        aria-label="Colour"
        className="flex h-6.5 items-center gap-2"
      >
        {COLORS.map((color, i) => {
          const active = i === colorIndex;
          const size = active ? COLOR_SIZE.active : COLOR_SIZE.idle;
          return (
            <motion.button
              key={color.key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={color.key}
              className={cn(
                "cursor-pointer overflow-hidden rounded-full outline-none focus-visible:ring-1 focus-visible:ring-white/60",
                active && "ring-1 ring-white",
              )}
              initial={false}
              animate={{ width: size, height: size, rotate: active ? 180 : 0 }}
              transition={CHIP_SPRING}
              onClick={() => onColorChange(i)}
            >
              {/* The scheme's two gradient stops, split on the diagonal */}
              <svg viewBox="0 0 32 32" className="block h-full w-full">
                <circle cx="16" cy="16" r="16" fill={color.gradientFrom} />
                <path d="M32 0L32 32L0 32Z" fill={color.gradientTo} />
              </svg>
            </motion.button>
          );
        })}
      </span>
    </motion.span>
  </span>
);
