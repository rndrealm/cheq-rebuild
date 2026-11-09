// Gesture physics, ported from rndr-interactions (src/app/ios/physics.ts).

export type Point = { x: number; y: number };

// Works out how fast the pointer is moving at the moment you let go, in px/s,
// from the last 100ms of pointer positions (so a slow drag ending in a flick
// reads as the flick's speed).
export class VelocityTracker {
  private samples: { t: number; x: number; y: number }[] = [];

  reset() {
    this.samples = [];
  }
  add(x: number, y: number) {
    const t = performance.now();
    this.samples.push({ t, x, y });
    this.samples = this.samples.filter((s) => t - s.t < 100);
  }

  get(): Point {
    const now = performance.now();
    const recent = this.samples.filter((s) => now - s.t < 100);
    if (recent.length < 2) return { x: 0, y: 0 };
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = (last.t - first.t) / 1000;
    if (dt === 0) return { x: 0, y: 0 };
    return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt };
  }
}

const RUBBER_BAND_C = 0.55;

export const rubberBand = (x: number, d: number, c = RUBBER_BAND_C) =>
  (1 - 1 / ((c * x) / d + 1)) * d;

export const applyRubberBand = (
  value: number,
  min: number,
  max: number,
  d: number,
  c = RUBBER_BAND_C,
) => {
  if (value < min) return min - rubberBand(min - value, d, c);
  if (value > max) return max + rubberBand(value - max, d, c);
  return value;
};

export const springFromResponse = (
  response: number,
  dampingRatio: number,
  mass = 1,
) => ({
  type: "spring" as const,
  stiffness: Math.pow((2 * Math.PI) / response, 2) * mass,
  damping: (4 * Math.PI * dampingRatio * mass) / response,
  mass,
});

export type Spring = ReturnType<typeof springFromResponse>;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const DECELERATION = { normal: 0.998, fast: 0.99 };

export const project = (velocity: number, rate = DECELERATION.normal) =>
  ((velocity / 1000) * rate) / (1 - rate);
