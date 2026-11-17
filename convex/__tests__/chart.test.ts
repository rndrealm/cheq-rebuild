import { describe, expect, test } from "vitest";
import {
  CHART_POINTS,
  downsample,
  parseKlines,
  type ChartPoint,
} from "../lib/chart";
import {
  curveYAt,
  formatChartTime,
  nearestPoint,
  NUM_POINTS,
  toChartData,
  withLivePrice,
} from "../../src/lib/helpers/chart";

const HOUR = 60 * 60 * 1000;

function series(prices: number[]): ChartPoint[] {
  return prices.map((price, i) => ({ time: i * HOUR, price }));
}

describe("parseKlines", () => {
  test("uses the close and close time, capping the open candle at now", () => {
    const now = 10_000;
    const klines = [
      [0, "1", "2", "0.5", "1.5", "9", 999],
      [1000, "1.5", "3", "1", "2.5", "9", 1999],
      [2000, "2.5", "3", "2", "2.75", "9", 99_999],
    ];
    expect(parseKlines(klines, now)).toEqual([
      { time: 1000, price: 1.5 },
      { time: 2000, price: 2.5 },
      { time: now, price: 2.75 },
    ]);
  });

  test("skips malformed candles and non-arrays", () => {
    expect(parseKlines({ code: -1121 }, 0)).toEqual([]);
    expect(parseKlines([[0, "1", "1", "1", "nope", "1", 1], "x"], 5)).toEqual(
      [],
    );
  });
});

describe("downsample", () => {
  test("leaves short series alone", () => {
    const points = series([1, 2, 3]);
    expect(downsample(points, CHART_POINTS)).toBe(points);
  });

  test("keeps the first, last, highest and lowest real candles", () => {
    const prices = Array.from({ length: 365 }, (_, i) => 100 + Math.sin(i / 9));
    prices[123] = 500;
    prices[250] = 1;
    const points = series(prices);
    const picked = downsample(points, CHART_POINTS);

    expect(picked).toHaveLength(CHART_POINTS);
    expect(picked[0]).toBe(points[0]);
    expect(picked.at(-1)).toBe(points[364]);
    expect(picked).toContain(points[123]);
    expect(picked).toContain(points[250]);
    // Every point is a real candle, in time order.
    for (const p of picked) expect(points).toContain(p);
    for (let i = 1; i < picked.length; i++) {
      expect(picked[i].time).toBeGreaterThan(picked[i - 1].time);
    }
  });
});

describe("toChartData", () => {
  test("places candles by time, high at the top and low at the bottom", () => {
    const chart = toChartData([
      { time: 0, price: 10 },
      { time: 1 * HOUR, price: 30 },
      { time: 4 * HOUR, price: 20 },
    ])!;
    expect(chart.points.map((p) => p.x)).toEqual([0, 0.25, 1]);
    expect(chart.points.map((p) => p.y)).toEqual([0.9, 0.1, 0.5]);
    expect(chart).toMatchObject({
      minPrice: 10,
      maxPrice: 30,
      basePrice: 10,
      latestPrice: 20,
      span: 4 * HOUR,
    });
  });

  test("always draws NUM_POINTS points so lines can morph", () => {
    const segments = (d: string) => d.split(" C").length - 1;
    const short = toChartData(series([1, 2, 3]))!;
    const long = toChartData(
      series(Array.from({ length: NUM_POINTS }, (_, i) => i)),
    )!;
    expect(segments(short.path)).toBe(NUM_POINTS - 1);
    expect(segments(long.path)).toBe(NUM_POINTS - 1);
  });

  test("is null with no candles", () => {
    expect(toChartData([])).toBeNull();
  });
});

describe("nearestPoint", () => {
  const { points } = toChartData(series([1, 2, 3, 4, 5]))!;

  test("snaps to the closest candle", () => {
    expect(nearestPoint(points, 0).price).toBe(1);
    expect(nearestPoint(points, 0.3).price).toBe(2);
    expect(nearestPoint(points, 0.4).price).toBe(3);
    expect(nearestPoint(points, 1).price).toBe(5);
  });

  test("works with a single candle", () => {
    const single = toChartData(series([7]))!.points;
    expect(nearestPoint(single, 0.8).price).toBe(7);
  });
});

describe("curveYAt", () => {
  test("passes through every candle", () => {
    const chart = toChartData(series([5, 9, 2, 7, 4, 8]))!;
    for (const p of chart.points) {
      expect(curveYAt(chart.curve, p.x)).toBeCloseTo(p.y, 4);
    }
  });

  test("follows a straight line between candles", () => {
    const chart = toChartData(series([0, 1, 2, 3, 4]))!;
    expect(curveYAt(chart.curve, 0.375)).toBeCloseTo(0.6, 4);
  });

  test("handles a single candle", () => {
    const chart = toChartData(series([3]))!;
    expect(curveYAt(chart.curve, 0.5)).toBe(chart.points[0].y);
  });
});

describe("withLivePrice", () => {
  const candles = series([1, 2, 3]);

  test("moves the open candle to a newer live price", () => {
    expect(withLivePrice(candles, { price: 3.5, updatedAt: 3 * HOUR })).toEqual(
      [...candles.slice(0, 2), { time: 3 * HOUR, price: 3.5 }],
    );
  });

  test("ignores a live price older than the chart", () => {
    expect(withLivePrice(candles, { price: 9, updatedAt: 2 * HOUR })).toBe(
      candles,
    );
  });

  test("leaves the chart alone with no live price or no candles", () => {
    expect(withLivePrice(candles, null)).toBe(candles);
    expect(withLivePrice([], { price: 1, updatedAt: 1 })).toEqual([]);
  });
});

describe("formatChartTime", () => {
  const time = Date.UTC(2026, 10, 9, 14, 45);
  test("shows the hour on short charts and the year on long ones", () => {
    expect(formatChartTime(time, 24 * HOUR)).not.toContain("2026");
    expect(formatChartTime(time, 365 * 24 * HOUR)).toContain("2026");
  });
});
