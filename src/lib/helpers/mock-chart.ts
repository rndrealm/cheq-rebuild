export type Candle = { time: number; value: number };

const INTERVAL_CONFIG: Record<string, { points: number; stepSeconds: number }> =
  {
    "1D": { points: 24, stepSeconds: 3600 },
    "1W": { points: 168, stepSeconds: 3600 },
    "1M": { points: 30, stepSeconds: 86400 },
    "1Y": { points: 365, stepSeconds: 86400 },
    YTD: {
      points: Math.ceil(
        (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) /
          86400000,
      ),
      stepSeconds: 86400,
    },
    All: { points: 730, stepSeconds: 86400 },
  };

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export function generateMockCandles(
  basePrice: number,
  interval: string,
  seed: string,
): Candle[] {
  const config = INTERVAL_CONFIG[interval] ?? INTERVAL_CONFIG["1D"];
  const { points, stepSeconds } = config;
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - points * stepSeconds;

  let hash = hashString(seed);
  hash = ((hash << 5) - hash + interval.charCodeAt(0)) | 0;
  const rand = seededRandom(Math.abs(hash) || 1);

  const volatility =
    interval === "1D" ? 0.008 : interval === "1W" ? 0.012 : 0.02;
  const drift = (rand() - 0.45) * 0.001;
  const candles: Candle[] = [];
  let price = basePrice * (0.7 + rand() * 0.5);

  for (let i = 0; i < points; i++) {
    const change = (rand() - 0.5) * 2 * volatility + drift;
    price = price * (1 + change);
    candles.push({
      time: startTime + i * stepSeconds,
      value: price,
    });
  }

  const scale = basePrice / candles[candles.length - 1].value;
  return candles.map((c) => ({ ...c, value: c.value * scale }));
}

export function generateMockValues(seed: string, points = 24): number[] {
  const rand = seededRandom(hashString(seed));
  const values: number[] = [];
  let price = 0.7 + rand() * 0.5;

  for (let i = 0; i < points; i++) {
    price *= 1 + (rand() - 0.5) * 0.016;
    values.push(price);
  }
  return values;
}

export function sampleAt(data: Candle[], t: number): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0].value;
  const idx = t * (data.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, data.length - 1);
  const frac = idx - lo;
  return data[lo].value * (1 - frac) + data[hi].value * frac;
}

export const MORPH_DURATION = 300;
