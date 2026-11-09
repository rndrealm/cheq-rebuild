"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";

const REFRESH_MS = 30_000;

export type TokenStats = NonNullable<
  FunctionReturnType<typeof api.tokens.getPrice>
>;

/**
 * Live price and 24h stats for a token, refreshed every 30s while mounted.
 * Mount one per token (e.g. key by symbol) so a new token starts clean.
 */
export function useTokenStats(symbol: string): TokenStats | null {
  const getPrice = useAction(api.tokens.getPrice);
  const [stats, setStats] = useState<TokenStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await getPrice({ symbol });
        if (!cancelled && next) setStats(next);
      } catch {
        // Keep showing the last stats; retry on the next tick.
      }
    }

    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [getPrice, symbol]);

  return stats;
}
