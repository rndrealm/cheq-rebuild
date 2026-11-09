"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";

export type TokenStats = FunctionReturnType<
  typeof api.market.snapshot
>[number];

/**
 * Latest price and 24h stats for every supported token, keyed by symbol.
 * Reactive: the server refreshes it every 30s and pushes changes, so there's
 * nothing to poll. Undefined while loading.
 */
export function useMarket(): Map<string, TokenStats> | undefined {
  const rows = useQuery(api.market.snapshot);
  return useMemo(
    () => (rows ? new Map(rows.map((row) => [row.symbol, row])) : undefined),
    [rows],
  );
}

/** One token's price and 24h stats, or null until it's available. */
export function useTokenStats(symbol: string): TokenStats | null {
  return useMarket()?.get(symbol) ?? null;
}
