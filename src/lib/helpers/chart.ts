import {
  CHART_POINTS,
  type ChartPoint as Candle,
} from "../../../convex/lib/chart";

// Every chart line, and the TokenCard's toggle icon, is drawn with exactly
// this many points so they can morph into each other.
export const NUM_POINTS = CHART_POINTS;

// A real candle placed in the chart's 0–1 box (y grows downward).
export type ChartPoint = Candle & { x: number; y: number };

type Coord = { x: number; y: number };

export type ChartData = {
  points: ChartPoint[];
  // The points the line is drawn through (padded to NUM_POINTS) and the line.
  curve: Coord[];
  path: string;
  minPrice: number;
  maxPrice: number;
  basePrice: number;
  latestPrice: number;
  // Time from the first candle to the last.
  span: number;
};

export function toPathD(points: number[]): string {
  return toSmoothPath(
    points.map((y, i) => ({ x: i / (points.length - 1), y })),
  );
}

// The cubic Bézier for the curve between coords[i] and coords[i + 1]:
// Catmull-Rom, so the curve passes through every point.
function segment(coords: Coord[], i: number): [Coord, Coord, Coord, Coord] {
  const p0 = coords[Math.max(i - 1, 0)];
  const p1 = coords[i];
  const p2 = coords[i + 1];
  const p3 = coords[Math.min(i + 2, coords.length - 1)];
  return [
    p1,
    { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
    { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
    p2,
  ];
}

const fmt = (p: Coord) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`;

// Smooth path through points in the 0–1 box.
// Unlike `toPathD`, x positions are free, e.g. placed by time.
export function toSmoothPath(coords: Coord[]): string {
  if (coords.length === 0) return "";

  let d = `M${fmt(coords[0])}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const [, c1, c2, end] = segment(coords, i);
    d += ` C${fmt(c1)} ${fmt(c2)} ${fmt(end)}`;
  }
  return d;
}

function bezier(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

// The curve's y at `x` (0–1), so the hover dot can glide along the line.
// Finds the segment spanning x, then the Bézier t whose x is x (bisection;
// x grows along each segment because points are in time order).
export function curveYAt(coords: Coord[], x: number): number {
  if (coords.length === 1) return coords[0].y;

  let i = 0;
  while (i < coords.length - 2 && coords[i + 1].x < x) i++;
  const [p1, c1, c2, p2] = segment(coords, i);
  if (p2.x <= p1.x) return p2.y;

  let lo = 0;
  let hi = 1;
  for (let step = 0; step < 20; step++) {
    const mid = (lo + hi) / 2;
    if (bezier(p1.x, c1.x, c2.x, p2.x, mid) < x) lo = mid;
    else hi = mid;
  }
  return bezier(p1.y, c1.y, c2.y, p2.y, (lo + hi) / 2);
}

// Lays candles out by time, highest price at y 0.1 and lowest at 0.9. The
// line goes through every candle.
export function toChartData(candles: Candle[]): ChartData | null {
  if (candles.length === 0) return null;

  const prices = candles.map((c) => c.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;
  const first = candles[0].time;
  const span = candles[candles.length - 1].time - first;

  const points = candles.map((c, i) => ({
    ...c,
    x: span > 0 ? (c.time - first) / span : i / Math.max(candles.length - 1, 1),
    y: 0.1 + ((maxPrice - c.price) / range) * 0.8,
  }));

  const curve = padTo(points, NUM_POINTS);
  return {
    points,
    curve,
    path: toSmoothPath(curve),
    minPrice,
    maxPrice,
    basePrice: candles[0].price,
    latestPrice: candles[candles.length - 1].price,
    span,
  };
}

// Swaps the open (last) candle's close for the live price when it's newer,
// so the line's tip follows the market between chart refreshes.
export function withLivePrice(
  candles: Candle[],
  live: { price: number; updatedAt: number } | null,
): Candle[] {
  const last = candles.at(-1);
  if (!live || !last || live.updatedAt <= last.time) return candles;
  return [...candles.slice(0, -1), { time: live.updatedAt, price: live.price }];
}

// Repeats points (in place, keeping order) until there are `length`, so a
// short series draws the same line with the point count the morph needs.
function padTo<T>(points: T[], length: number): T[] {
  if (points.length >= length) return points;
  return Array.from(
    { length },
    (_, i) => points[Math.floor((i * points.length) / length)],
  );
}

// The candle closest to `x` (0–1). Points are sorted by x.
export function nearestPoint(points: ChartPoint[], x: number): ChartPoint {
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid].x <= x) lo = mid;
    else hi = mid;
  }
  return Math.abs(points[hi].x - x) < Math.abs(points[lo].x - x)
    ? points[hi]
    : points[lo];
}

const DAY_MS = 24 * 60 * 60 * 1000;

const withTime = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const withYear = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// A candle's time for the hover tooltip: with the hour on charts up to a
// month long (intraday candles), with the year on longer ones.
export function formatChartTime(time: number, span: number): string {
  return (span <= 35 * DAY_MS ? withTime : withYear).format(time);
}

export const INTERVALS = ["1D", "1W", "1M", "1Y", "YTD", "All"] as const;

// The resting shape of the TokenCard's chart toggle icon.
const TOGGLE_POINTS: number[] = Array.from(
  { length: NUM_POINTS },
  (_, i) => {
    const t = i / (NUM_POINTS - 1);
    return 0.5 + 0.18 * Math.sin(t * Math.PI * 2.5);
  },
);

export const TOGGLE_D = toPathD(TOGGLE_POINTS);
