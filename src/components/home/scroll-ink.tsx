"use client";

import { cn } from "@/lib/utils";
import {
  motion,
  type MotionStyle,
  type MotionValue,
  useScroll,
  useTransform,
} from "motion/react";
import React, { createContext, useContext, useRef } from "react";

// The ink's 0 -> 1 scroll progress, for inline elements that react to it
const ScrollInkProgress = createContext<MotionValue<number> | null>(null);
export const useScrollInkProgress = () => {
  const progress = useContext(ScrollInkProgress);
  if (!progress) throw new Error("useScrollInkProgress must be used inside ScrollInk");
  return progress;
};

// Ink colours come from the theme (--ink-faint/--ink-body/--ink-strong, see
// globals.css). Each word's 0..1 fill is passed as --ink and CSS mixes the colours,
// so the fill follows a theme switch, even mid-scroll.
const inkColor = (target: string) =>
  `color-mix(in srgb, var(${target}) calc(var(--ink) * 100%), var(--ink-faint))`;
const INK_BODY = inkColor("--ink-body");
const INK_STRONG = inkColor("--ink-strong");
// Progress runs 0 -> 1 from the block's top entering the bottom of the viewport, to
// its bottom being fully in view. Ends low on purpose: near the foot of the page the
// block can't scroll much higher, and an end point it never reaches leaves words faint.
const SCROLL_OFFSET = ["start 0.9", "end 0.85"] as const;

export type InkSegment =
  | { text: string; strong?: boolean }
  // Inline non-text content (e.g. an icon), shown as-is
  | { element: React.ReactNode };

const InkWord = ({
  progress,
  range,
  strong,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  strong?: boolean;
  children: string;
}) => {
  const ink = useTransform(progress, range, [0, 1]);
  return (
    <motion.span
      className={cn(strong && "font-medium")}
      // Motion animates CSS variables, but MotionStyle doesn't type custom properties
      style={
        { "--ink": ink, color: strong ? INK_STRONG : INK_BODY } as MotionStyle
      }
    >
      {children}
    </motion.span>
  );
};

/**
 * Text that inks in word by word, in reading order, as it scrolls through the
 * viewport. Scrubbed, so it reverses on the way back up. Strong segments land on
 * --ink-strong, the rest on --ink-body. Only colour changes, so the text never reflows.
 */
export const ScrollInk = ({
  segments,
  className,
  children,
}: {
  segments: InkSegment[];
  className?: string;
  // Rendered after the text, un-inked
  children?: React.ReactNode;
}) => {
  // A block element: scroll progress is measured off its height
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [...SCROLL_OFFSET],
  });

  const wordCount = segments.reduce(
    (n, s) => ("text" in s ? n + s.text.split(/\s+/).filter(Boolean).length : n),
    0,
  );
  let wordIndex = 0;

  return (
    <ScrollInkProgress value={scrollYProgress}>
    <div ref={ref} className={className}>
      <p className="inline">
        {segments.map((segment, s) => {
          if (!("text" in segment)) {
            return <React.Fragment key={s}>{segment.element}</React.Fragment>;
          }
          // Keep the whitespace between words as plain text, so wrapping is unchanged
          return segment.text.split(/(\s+)/).map((part, p) => {
            if (!part.trim()) return part;
            const i = wordIndex++;
            return (
              <InkWord
                key={`${s}-${p}`}
                progress={scrollYProgress}
                range={[i / wordCount, (i + 1) / wordCount]}
                strong={segment.strong}
              >
                {part}
              </InkWord>
            );
          });
        })}
      </p>
      {children}
    </div>
    </ScrollInkProgress>
  );
};
