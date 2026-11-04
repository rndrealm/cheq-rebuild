"use client";

// DEMO COPY of ../bet-chart.tsx for the demo widget. Iterate here freely.

import { useRef, useState } from "react";
import { toSmoothPath } from "@/lib/helpers/chart";
import { formatPrice } from "@/lib/helpers/format";
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

// Linear value of a line at time t (points are in time order). Clamped to the
// line's ends.
function valueAt(points: ChartPoint[], t: number): number | null {
  if (points.length === 0) return null;
  if (t <= points[0].t) return points[0].v;
  const last = points[points.length - 1];
  if (t >= last.t) return last.v;
  for (let i = 1; i < points.length; i++) {
    const b = points[i];
    if (b.t >= t) {
      const a = points[i - 1];
      const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
      return a.v + (b.v - a.v) * f;
    }
  }
  return last.v;
}

function formatClock(t: number): string {
  return new Date(t).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Keeps a chip inside the chart: at x=0 it hangs right of the point, at x=1
// left of it, and slides smoothly in between.
function edgeSafe(x: number) {
  return { left: `${x * 100}%`, transform: `translateX(-${x * 100}%)` };
}

/**
 * A bet's price over its whole window. The x-axis is fixed to the window
 * (start → resolves), so the line only reaches as far as "now" and the empty
 * space to its right is the time left. Reference lines (start price, target)
 * are dashed and labelled.
 */
export function DemoBetChart({
  start,
  end,
  lines,
  references,
  markers = [],
  onMarkerHover,
  formatValue = formatPrice,
}: {
  start: number;
  end: number;
  lines: ChartLine[];
  references: ReferenceLine[];
  markers?: ChartMarker[];
  onMarkerHover?: (id: string | null) => void;
  /** Formats the hover readout. Defaults to a price. */
  formatValue?: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Cursor position across the chart (0–1), or null when not hovering.
  const [hoverX, setHoverX] = useState<number | null>(null);

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

  // The viewer's line is drawn last (on top); the readout and the target
  // connector follow it.
  const primary = lines[lines.length - 1];
  const lastT = primary?.points[primary.points.length - 1]?.t ?? start;
  // Hovering the empty future snaps to "now".
  const focusT =
    hoverX === null ? lastT : Math.min(start + hoverX * (end - start), lastT);
  const focusX = toX(focusT);
  const focusV = primary ? valueAt(primary.points, focusT) : null;
  const target = references.find((r) => r.strong);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setHoverX(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHoverX(null)}
      className="relative h-40 w-full"
    >
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
              ref.strong ? "border-fg-base/40" : "border-[#D1D1D1]",
            )}
          />
          <span
            className={cn(
              "absolute right-0 bottom-0.5 text-[10px] font-semibold leading-3 tabular-nums",
              ref.strong ? "text-fg-400" : "text-fg-300",
            )}
          >
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

      {/* Gap to target: a dashed connector from the price up (or down) to
          the target line, labelled with the move still needed. Sits on the
          live point, and follows the cursor while hovering. */}
      {target && focusV !== null && focusV > 0 && (
        <TargetGap
          x={focusX}
          fromY={toY(focusV)}
          toY={toY(target.value)}
          pct={((target.value - focusV) / focusV) * 100}
        />
      )}

      {/* Hover: hairline, a dot on each line, and a readout just under the
          chart (above it would cover the price summary). */}
      {hoverX !== null && focusV !== null && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-fg-base/15"
            style={{ left: `${focusX * 100}%` }}
          />
          {lines.map((line, i) => {
            const v = valueAt(line.points, focusT);
            if (v === null) return null;
            return (
              <span
                key={i}
                aria-hidden
                className="pointer-events-none absolute z-20 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
                style={{
                  left: `${focusX * 100}%`,
                  top: `${toY(v) * 100}%`,
                  backgroundColor: line.color,
                }}
              />
            );
          })}
          <div
            className="pointer-events-none absolute top-full z-20 mt-1 flex items-baseline gap-1.5 whitespace-nowrap rounded-md bg-fg-base px-1.5 py-1 text-[11px] leading-3 tabular-nums"
            style={edgeSafe(focusX)}
          >
            <span className="font-semibold text-white">
              {formatValue(focusV)}
            </span>
            <span className="text-white/60">{formatClock(focusT)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function TargetGap({
  x,
  fromY,
  toY,
  pct,
}: {
  x: number;
  fromY: number;
  toY: number;
  pct: number;
}) {
  const top = Math.min(fromY, toY);
  const height = Math.abs(fromY - toY);
  const reached = Math.abs(pct) < 0.005;
  // Label on whichever side of the connector has more room.
  const labelLeft = x > 0.6;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: `${x * 100}%`,
        top: `${top * 100}%`,
        height: `${height * 100}%`,
      }}
    >
      <div className="absolute inset-y-0 -translate-x-1/2 border-l border-dashed border-fg-base/30" />
      {height > 0.12 && (
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-card px-1.5 py-0.5 text-[10px] font-semibold leading-3 tabular-nums text-fg-400 shadow-[0_0_0_1px_rgb(0_0_0/0.08)]",
            labelLeft ? "right-2" : "left-2",
          )}
        >
          {reached
            ? "At target"
            : `${pct > 0 ? "+" : ""}${pct.toFixed(2)}% to go`}
        </span>
      )}
    </div>
  );
}
