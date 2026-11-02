"use client";

import { useCallback, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toPathD, resample, NUM_POINTS } from "@/lib/helpers/chart";

export type ChartData = {
  points: number[];
  path: string;
  minPrice: number;
  maxPrice: number;
  basePrice: number;
  latestPrice: number;
};

function normalizeCloses(
  closes: number[],
  minPrice: number,
  maxPrice: number,
): number[] {
  const range = maxPrice - minPrice || 1;
  return closes.map((c) => 0.1 + ((maxPrice - c) / range) * 0.8);
}

export function useTokenChart(symbol: string) {
  const [data, setData] = useState<Record<string, ChartData>>({});
  const [loading, setLoading] = useState(false);
  const getChartData = useAction(api.tokens.getChartData);
  const fetchedRef = useRef<Set<string>>(new Set());

  const fetchInterval = useCallback(
    async (interval: string) => {
      const key = `${symbol}:${interval}`;
      if (fetchedRef.current.has(key)) return;
      fetchedRef.current.add(key);

      setLoading(true);
      try {
        const result = await getChartData({ symbol, interval });
        if (!result) {
          setLoading(false);
          return;
        }

        const resampled = resample(result.closes, NUM_POINTS);
        const points = normalizeCloses(
          resampled,
          result.minPrice,
          result.maxPrice,
        );
        const path = toPathD(points);

        setData((prev) => ({
          ...prev,
          [interval]: {
            points,
            path,
            minPrice: result.minPrice,
            maxPrice: result.maxPrice,
            basePrice: result.basePrice,
            latestPrice: result.latestPrice,
          },
        }));
      } catch {
        fetchedRef.current.delete(key);
      } finally {
        setLoading(false);
      }
    },
    [symbol, getChartData],
  );

  return { data, loading, fetchInterval };
}
