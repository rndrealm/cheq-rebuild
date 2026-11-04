import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Trend-in-a-circle marker for bet update rows. Strokes use currentColor,
// so set the tone via `color` (style or text-* class). `down` flips the
// trend arrow for bad-news updates.
export function UpdateIcon({
  down = false,
  className,
  style,
}: {
  down?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", down && "-scale-y-100", className)}
      style={style}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M7.75 14.25L9 13C9.55229 12.4477 10.4477 12.4477 11 13C11.5523 13.5523 12.4477 13.5523 13 13L15.5 10.5" />
      <path d="M13 10H16V13" />
    </svg>
  );
}
