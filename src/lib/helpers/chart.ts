const NUM_POINTS = 30;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generatePoints(seed: number, trend: number): number[] {
  const rand = seededRandom(seed);
  const raw: number[] = [];
  let value = 0.5 + (rand() - 0.5) * 0.2;
  for (let i = 0; i < NUM_POINTS; i++) {
    value += (rand() - 0.5) * 0.12 + trend / NUM_POINTS;
    raw.push(value);
  }
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const range = max - min || 1;
  return raw.map((v) => 0.1 + ((v - min) / range) * 0.8);
}

export function toPathD(points: number[]): string {
  const coords = points.map((y, i) => ({
    x: i / (points.length - 1),
    y,
  }));

  let d = `M${coords[0].x.toFixed(4)},${coords[0].y.toFixed(4)}`;

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x.toFixed(4)},${cp1y.toFixed(4)} ${cp2x.toFixed(4)},${cp2y.toFixed(4)} ${p2.x.toFixed(4)},${p2.y.toFixed(4)}`;
  }

  return d;
}

export function interpolateY(points: number[], normX: number): number {
  const floatIdx = normX * (points.length - 1);
  const i = Math.floor(floatIdx);
  if (i >= points.length - 1) return points[points.length - 1];
  const t = floatIdx - i;
  return points[i] + (points[i + 1] - points[i]) * t;
}

export const INTERVALS = ["1D", "1W", "1M", "1Y", "YTD", "All"] as const;

export const TOGGLE_POINTS: number[] = Array.from(
  { length: NUM_POINTS },
  (_, i) => {
    const t = i / (NUM_POINTS - 1);
    return 0.5 + 0.18 * Math.sin(t * Math.PI * 2.5);
  },
);

export const INTERVAL_DATA: Record<string, number[]> = {
  "1D": generatePoints(42, -0.3),
  "1W": generatePoints(137, -0.15),
  "1M": generatePoints(291, 0.1),
  "1Y": generatePoints(503, -0.4),
  YTD: generatePoints(777, 0.25),
  All: generatePoints(1001, -0.2),
};

export const TOGGLE_D = toPathD(TOGGLE_POINTS);

export const INTERVAL_PATHS: Record<string, string> = Object.fromEntries(
  Object.entries(INTERVAL_DATA).map(([k, v]) => [k, toPathD(v)]),
);

export const BASE_PRICE = 1847.32;
export const PRICE_RANGE = 400;
