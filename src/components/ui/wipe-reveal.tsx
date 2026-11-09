"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Loading → loaded transition: once `revealed`, the content swaps in under a
 * copy of the skeleton, which wipes away with a soft edge (`.wipe-reveal` in
 * globals.css). Mounting already revealed shows the content with no wipe.
 *
 * The overlay is opaque so the swap underneath isn't seen: give it the
 * background behind this area via `className` (default `bg-card`). Speed is
 * the `--wipe-duration` CSS variable (default 0.6s).
 */
export function WipeReveal({
  revealed,
  skeleton,
  children,
  className,
}: {
  revealed: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  // Classes for the overlay, e.g. its background
  className?: string;
}) {
  // The overlay is removed once the wipe finishes, so the skeleton isn't
  // left in the DOM; it comes back if `revealed` goes false again.
  const [wiped, setWiped] = useState(revealed);
  const [prevRevealed, setPrevRevealed] = useState(revealed);
  if (revealed !== prevRevealed) {
    setPrevRevealed(revealed);
    if (!revealed) setWiped(false);
  }

  return (
    <div className="relative" aria-busy={!revealed}>
      {revealed ? children : skeleton}
      {!wiped && (
        <div
          aria-hidden
          data-revealed={revealed}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget && revealed) setWiped(true);
          }}
          className={cn(
            "wipe-reveal pointer-events-none absolute inset-0 overflow-hidden bg-card",
            className,
          )}
        >
          {skeleton}
        </div>
      )}
    </div>
  );
}
