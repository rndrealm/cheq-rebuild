"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const WIPE_STYLES = `
  @property --wipe {
    syntax: '<percentage>';
    inherits: true;
    initial-value: 0%;
  }
  .wipe-reveal-overlay {
    --wipe: 0%;
    mask-image: linear-gradient(to right, black var(--wipe), transparent calc(var(--wipe) + 100%));
    -webkit-mask-image: linear-gradient(to right, black var(--wipe), transparent calc(var(--wipe) + 100%));
    transition: --wipe 0.6s ease-in-out;
  }
  .wipe-reveal-overlay[data-revealed="true"] {
    --wipe: -100%;
  }
  .wipe-reveal-overlay[data-revealed="false"] {
    --wipe: 100%;
  }
`;

export function WipeReveal({
  className,
  children,
  revealed,
  skeleton,
}: {
  className?: string;
  children: ReactNode;
  revealed: boolean;
  skeleton: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden">
      <style>{WIPE_STYLES}</style>
      {revealed ? children : skeleton}
      <div
        className={cn(
          "wipe-reveal-overlay pointer-events-none absolute inset-0 bg-white",
          className,
        )}
        data-revealed={revealed}
      >
        {skeleton}
      </div>
    </div>
  );
}
