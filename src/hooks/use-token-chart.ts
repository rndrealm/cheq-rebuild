"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  CHART_TTL_MS,
  DEFAULT_CHART_TTL_MS,
  type ChartPoint as Candle,
} from "../../convex/lib/chart";
import { useTokenStats } from "@/hooks/use-market";
import {
  toChartData,
  withLivePrice,
  type ChartData,
} from "@/lib/helpers/chart";

export type { ChartData };

// How often to check whether a requested range is due a refresh.
const CHECK_MS = 30_000;

/**
 * A token's chart per range ("1D", "1W", …), fetched on first request. Kept
 * live: the last point follows the market snapshot (updated every 30s by the
 * cron), and each requested range is refetched once its server cache expires
 * so the window moves forward. Refreshing pauses while the tab is hidden.
 */
export function useTokenChart(symbol: string) {
  // Candles per `${symbol}:${interval}`.
  const [series, setSeries] = useState<Record<string, Candle[]>>({});
  const getChartData = useAction(api.tokens.getChartData);
  const stats = useTokenStats(symbol);

  const requested = useRef(new Set<string>());
  const inFlight = useRef(new Set<string>());
  const fetchedAt = useRef(new Map<string, number>());

  const load = useCallback(
    async (interval: string) => {
      const key = `${symbol}:${interval}`;
      if (inFlight.current.has(key)) return;
      inFlight.current.add(key);
      try {
        const candles = await getChartData({ symbol, interval });
        if (candles?.length) {
          fetchedAt.current.set(key, Date.now());
          setSeries((prev) => ({ ...prev, [key]: candles }));
        }
      } catch {
        // Retried by the refresh check.
      } finally {
        inFlight.current.delete(key);
      }
    },
    [symbol, getChartData],
  );

  const fetchInterval = useCallback(
    async (interval: string) => {
      const key = `${symbol}:${interval}`;
      if (requested.current.has(key)) return;
      requested.current.add(key);
      await load(interval);
    },
    [symbol, load],
  );

  // Refetch requested ranges whose cache has expired (or whose fetch failed).
  useEffect(() => {
    const prefix = `${symbol}:`;
    const refresh = () => {
      if (document.hidden) return;
      for (const key of requested.current) {
        if (!key.startsWith(prefix)) continue;
        const interval = key.slice(prefix.length);
        const ttl = CHART_TTL_MS[interval] ?? DEFAULT_CHART_TTL_MS;
        if (Date.now() - (fetchedAt.current.get(key) ?? 0) >= ttl) {
          void load(interval);
        }
      }
    };
    const id = setInterval(refresh, CHECK_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [symbol, load]);

  const livePrice = stats?.price;
  const liveAt = stats?.updatedAt;

  const data = useMemo(() => {
    const live =
      livePrice !== undefined && liveAt !== undefined
        ? { price: livePrice, updatedAt: liveAt }
        : null;
    const prefix = `${symbol}:`;
    const charts: Record<string, ChartData> = {};
    for (const [key, candles] of Object.entries(series)) {
      if (!key.startsWith(prefix)) continue;
      const chart = toChartData(withLivePrice(candles, live));
      if (chart) charts[key.slice(prefix.length)] = chart;
    }
    return charts;
  }, [series, symbol, livePrice, liveAt]);

  return { data, fetchInterval };
}
