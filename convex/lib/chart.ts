import { v, type Infer } from "convex/values";

// One real candle on a token chart: its close and when it closed.
export const chartPointValidator = v.object({
  time: v.number(),
  price: v.number(),
});
export type ChartPoint = Infer<typeof chartPointValidator>;

// Most points a chart can have. Every chart line is drawn with exactly this
// many points so lines (and the TokenCard's toggle icon) can morph into each
// other, so the client pads shorter series up to it.
export const CHART_POINTS = 96;

// How long a range's chart is cached before it's refetched from Binance. The
// client refreshes on the same schedule so the window moves forward; each is
// shorter than the range's candle size, so between refreshes only the open
// candle changes.
export const CHART_TTL_MS: Record<string, number> = {
  "1D": 2 * 60 * 1000,
  "1W": 10 * 60 * 1000,
  "1M": 30 * 60 * 1000,
  "6M": 60 * 60 * 1000,
  "1Y": 60 * 60 * 1000,
  YTD: 30 * 60 * 1000,
  All: 60 * 60 * 1000,
};
export const DEFAULT_CHART_TTL_MS = 10 * 60 * 1000;

// Binance klines → points. `time` is when the candle closed; the last candle
// is still open, so its time is now.
export function parseKlines(data: unknown, now: number): ChartPoint[] {
  if (!Array.isArray(data)) return [];
  const points: ChartPoint[] = [];
  for (const candle of data) {
    if (!Array.isArray(candle)) continue;
    const price = parseFloat(candle[4]);
    const closeTime = Number(candle[6]) + 1;
    if (!Number.isFinite(price) || !Number.isFinite(closeTime)) continue;
    points.push({ time: Math.min(closeTime, now), price });
  }
  return points;
}

// Picks at most `max` of the points, all of them real candles, keeping the
// shape of the line: the first and last points, the highest and lowest, and
// otherwise the most visually significant point in each bucket
// (Largest-Triangle-Three-Buckets).
export function downsample(points: ChartPoint[], max: number): ChartPoint[] {
  if (points.length <= max || max < 3) return points;

  let hi = 0;
  let lo = 0;
  points.forEach((p, i) => {
    if (p.price > points[hi].price) hi = i;
    if (p.price < points[lo].price) lo = i;
  });

  const picked: ChartPoint[] = [points[0]];
  const bucketSize = (points.length - 2) / (max - 2);
  let prev = 0;

  for (let b = 0; b < max - 2; b++) {
    const start = Math.floor(b * bucketSize) + 1;
    const end = Math.floor((b + 1) * bucketSize) + 1;

    let choice = -1;
    if (hi >= start && hi < end) choice = hi;
    else if (lo >= start && lo < end) choice = lo;

    if (choice === -1) {
      // Average of the next bucket (or the last point) as the third corner.
      const nextStart = end;
      const nextEnd = Math.min(
        Math.floor((b + 2) * bucketSize) + 1,
        points.length,
      );
      let avgTime = 0;
      let avgPrice = 0;
      const count = Math.max(nextEnd - nextStart, 1);
      for (let i = nextStart; i < nextStart + count; i++) {
        const p = points[Math.min(i, points.length - 1)];
        avgTime += p.time;
        avgPrice += p.price;
      }
      avgTime /= count;
      avgPrice /= count;

      let maxArea = -1;
      const a = points[prev];
      for (let i = start; i < end; i++) {
        const p = points[i];
        const area = Math.abs(
          (a.time - avgTime) * (p.price - a.price) -
            (a.time - p.time) * (avgPrice - a.price),
        );
        if (area > maxArea) {
          maxArea = area;
          choice = i;
        }
      }
    }

    picked.push(points[choice]);
    prev = choice;
  }

  picked.push(points[points.length - 1]);
  return picked;
}
