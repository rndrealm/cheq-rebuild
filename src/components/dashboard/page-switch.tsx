"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { AppRoutes } from "@/lib/routes";

// The expand icon has two corners and the collapse icon four. The two they
// share morph (same path structure, start to end), the other two fade in.
const CORNERS = {
  bottomLeft: {
    expand: "M4.5 9.75 L4.5 12 C4.5 12.83 5.17 13.5 6 13.5 L8.25 13.5",
    collapse: "M3 11.25 L4.5 11.25 C5.74 11.25 6.75 12.26 6.75 13.5 L6.75 15",
  },
  topRight: {
    expand: "M13.5 8.25 L13.5 6 C13.5 5.17 12.83 4.5 12 4.5 L9.75 4.5",
    collapse: "M15 6.75 L13.5 6.75 C12.26 6.75 11.25 5.74 11.25 4.5 L11.25 3",
  },
};
const TOP_LEFT = "M3 6.75H4.5C5.74264 6.75 6.75 5.74264 6.75 4.5V3";
const BOTTOM_RIGHT = "M11.25 15V13.5C11.25 12.2573 12.2573 11.25 13.5 11.25H15";

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/**
 * The button that moves between Home and Feed. It lives in the shared layout
 * so it stays in place across the page change, and its icon morphs from
 * expand to collapse.
 */
export function PageSwitch() {
  const onFeed = usePathname() === AppRoutes.feed.path;
  const reducedMotion = useReducedMotion();
  const icon = onFeed ? "collapse" : "expand";
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.35, bounce: 0 };

  return (
    <Link
      href={onFeed ? AppRoutes.home.path : AppRoutes.feed.path}
      aria-label={onFeed ? "Back to dashboard" : "Open feed"}
      title={onFeed ? "Back to dashboard" : "Open feed"}
      // Holds still during page transitions (see globals.css)
      style={{ viewTransitionName: "page-switch" }}
      className="absolute top-19.25 right-8 z-10 flex size-9 items-center justify-center rounded-lg text-fg-base outline-none transition-colors hover:bg-gray-3 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <svg viewBox="0 0 18 18" fill="none" aria-hidden className="size-4.5">
        <motion.path
          initial={false}
          animate={{ d: CORNERS.bottomLeft[icon] }}
          transition={transition}
          {...STROKE}
        />
        <motion.path
          initial={false}
          animate={{ d: CORNERS.topRight[icon] }}
          transition={transition}
          {...STROKE}
        />
        <motion.path
          d={TOP_LEFT}
          initial={false}
          animate={{ opacity: onFeed ? 1 : 0 }}
          transition={transition}
          {...STROKE}
        />
        <motion.path
          d={BOTTOM_RIGHT}
          initial={false}
          animate={{ opacity: onFeed ? 1 : 0 }}
          transition={transition}
          {...STROKE}
        />
      </svg>
    </Link>
  );
}
