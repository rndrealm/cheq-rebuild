"use client";

import { toSmoothPath } from "@/lib/helpers/chart";
import { cn } from "@/lib/utils";
import type { ChartPoint } from "@/hooks/use-bet-chart";

export type ChartLine = {
  points: ChartPoint[];
  color: string;
};

export type ReferenceLine = {
  value: number;
  label: string;
  strong?: boolean;
};

// A checkpoint on the line. Hovering one reports its id so the matching
// update card can highlight (and the other way round via `active`).
export type ChartMarker = {
  id: string;
  t: number;
  v: number;
  color: string;
  label: string;
  active?: boolean;
};

// Matches the TokenCard chart: lines sit between 10% and 90% of the height.
const Y_TOP = 0.1;
const Y_SPAN = 0.8;

/**
 * A bet's price over its whole window. The x-axis is fixed to the window
 * (start → resolves), so the line only reaches as far as "now" and the empty
 * space to its right is the time left. Reference lines (start price, target)
 * are dashed and labelled.
 */
export function BetChart({
  start,
  end,
  lines,
  references,
  markers = [],
  onMarkerHover,
  className,
}: {
  start: number;
  end: number;
  lines: ChartLine[];
  references: ReferenceLine[];
  markers?: ChartMarker[];
  onMarkerHover?: (id: string | null) => void;
  /** Overrides the default h-40 height. */
  className?: string;
}) {
  // Fit the y-range to the data and every reference line so a far-off target
  // stays on the chart.
  const values = [
    ...lines.flatMap((l) => l.points.map((p) => p.v)),
    ...references.map((r) => r.value),
    ...markers.map((m) => m.v),
  ];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    // Flat data (e.g. the bet just started): give it some room.
    const pad = Math.abs(min) * 0.001 || 1;
    min -= pad;
    max += pad;
  }

  const toX = (t: number) =>
    Math.min(1, Math.max(0, (t - start) / (end - start)));
  const toY = (v: number) => Y_TOP + ((max - v) / (max - min)) * Y_SPAN;

  return (
    <div className={cn("relative h-40 w-full", className)}>
      {/* Reference lines are HTML so the dashes stay crisp at any width. */}
      {references.map((ref) => (
        <div
          key={ref.label}
          className="absolute inset-x-0"
          style={{ top: `${toY(ref.value) * 100}%` }}
        >
          <div
            className={cn(
              "border-t border-dashed",
              ref.strong ? "border-fg-400" : "border-[#D1D1D1]",
            )}
          />
          <span className="absolute right-0 bottom-0.5 text-[10px] font-semibold leading-3 text-fg-300">
            {ref.label}
          </span>
        </div>
      ))}

      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        {lines.map((line, i) => (
          <path
            key={i}
            d={toSmoothPath(
              line.points.map((p) => ({ x: toX(p.t), y: toY(p.v) })),
            )}
            stroke={line.color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Checkpoint markers. */}
      {markers.map((marker) => (
        <span
          key={marker.id}
          title={marker.label}
          onMouseEnter={() => onMarkerHover?.(marker.id)}
          onMouseLeave={() => onMarkerHover?.(null)}
          className={cn(
            "absolute z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card ring-2 transition-transform duration-150",
            marker.active && "scale-150",
          )}
          style={{
            left: `${toX(marker.t) * 100}%`,
            top: `${toY(marker.v) * 100}%`,
            // The ring uses currentColor.
            color: marker.color,
          }}
        />
      ))}

      {/* Live dot at the newest point of each line. */}
      {lines.map((line, i) => {
        const last = line.points[line.points.length - 1];
        if (!last) return null;
        return (
          <span
            key={i}
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${toX(last.t) * 100}%`,
              top: `${toY(last.v) * 100}%`,
            }}
          >
            <span
              className="absolute inset-0 animate-ping rounded-full opacity-40"
              style={{ backgroundColor: line.color }}
            />
            <span
              className="absolute inset-0 rounded-full ring-2 ring-card"
              style={{ backgroundColor: line.color }}
            />
          </span>
        );
      })}
    </div>
  );
}
