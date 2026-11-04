"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

const REFRESH_MS = 30_000;

export type ChartPoint = { t: number; v: number };

export type BetSeries = {
  points: ChartPoint[];
  latest: number;
};

type Leg = { symbol: string; startPrice: number };

/**
 * Price history for a bet's window, refreshed every 30s while mounted. Each
 * series starts with a point at the bet's start price so the line begins on
 * the start line. `b` is only set for token-vs-token bets.
 *
 * Mount one per bet (e.g. key the component by bet id) so a new bet starts
 * from a clean state.
 */
export function useBetChart({
  a,
  b,
  start,
  end,
}: {
  a: Leg;
  b?: Leg;
  start: number;
  end: number;
}): { a: BetSeries | null; b: BetSeries | null } | null {
  const getBetChart = useAction(api.tokens.getBetChart);
  const [data, setData] = useState<{
    a: BetSeries | null;
    b: BetSeries | null;
  } | null>(null);

  const symbolA = a.symbol;
  const startA = a.startPrice;
  const symbolB = b?.symbol;
  const startB = b?.startPrice;

  useEffect(() => {
    let cancelled = false;

    async function fetchLeg(
      symbol: string,
      startPrice: number,
    ): Promise<BetSeries | null> {
      const result = await getBetChart({ symbol, startTime: start, endTime: end });
      if (!result) return null;
      const points: ChartPoint[] = [
        { t: start, v: startPrice },
        ...result.times.map((t, i) => ({ t, v: result.closes[i] })),
      ];
      return { points, latest: points[points.length - 1].v };
    }

    async function load() {
      try {
        const [nextA, nextB] = await Promise.all([
          fetchLeg(symbolA, startA),
          symbolB !== undefined && startB !== undefined
            ? fetchLeg(symbolB, startB)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        // Keep the last good data if a refresh fails.
        setData((prev) => ({
          a: nextA ?? prev?.a ?? null,
          b: nextB ?? prev?.b ?? null,
        }));
      } catch {
        // Network or Binance error: keep showing what we have; retry next tick.
      }
    }

    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [getBetChart, symbolA, startA, symbolB, startB, start, end]);

  return data;
}
