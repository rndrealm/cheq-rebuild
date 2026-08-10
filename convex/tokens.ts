"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { LIQUIDITY_THRESHOLD } from "./lib/constants";

export const search = action({
  args: { query: v.string() },
  handler: async (_ctx, args) => {
    if (args.query.length < 2) return [];

    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(args.query)}`,
    );
    if (!res.ok) return [];

    const data = await res.json();
    const pairs = data?.pairs ?? [];

    return pairs
      .filter(
        (p: any) =>
          p.liquidity?.usd >= LIQUIDITY_THRESHOLD && p.baseToken?.symbol,
      )
      .slice(0, 20)
      .map((p: any) => ({
        address: p.baseToken.address,
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,
        chain: p.chainId,
        pairAddress: p.pairAddress,
        priceUsd: parseFloat(p.priceUsd) || 0,
        priceChange24h: p.priceChange?.h24 ?? 0,
        liquidity: p.liquidity?.usd ?? 0,
      }));
  },
});

export const getPrice = action({
  args: {
    pairAddress: v.string(),
    chain: v.string(),
  },
  handler: async (_ctx, args) => {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/pairs/${args.chain}/${args.pairAddress}`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const price = parseFloat(data?.pair?.priceUsd);
    if (isNaN(price)) return null;

    return {
      price,
      priceChange24h: data.pair.priceChange?.h24 ?? 0,
      liquidity: data.pair.liquidity?.usd ?? 0,
      symbol: data.pair.baseToken?.symbol ?? "",
    };
  },
});
