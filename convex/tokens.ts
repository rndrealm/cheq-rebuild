"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  SUPPORTED_SYMBOLS,
  binanceApiUrl,
  toBinanceSymbol,
} from "./lib/tokens";

const INTERVAL_CONFIG: Record<
  string,
  { interval: string; limit: number }
> = {
  "1D": { interval: "1h", limit: 24 },
  "1W": { interval: "4h", limit: 42 },
  "1M": { interval: "1d", limit: 30 },
  "1Y": { interval: "1d", limit: 365 },
  YTD: { interval: "1d", limit: 0 },
  All: { interval: "1w", limit: 200 },
};

export const getChartData = action({
  args: {
    symbol: v.string(),
    interval: v.string(),
  },
  handler: async (ctx, args): Promise<{
    closes: number[];
    basePrice: number;
    latestPrice: number;
    minPrice: number;
    maxPrice: number;
  } | null> => {
    if (!SUPPORTED_SYMBOLS.has(args.symbol)) return null;

    const cached: {
      closes: number[];
      basePrice: number;
      latestPrice: number;
      minPrice: number;
      maxPrice: number;
    } | null = await ctx.runQuery(internal.chartCache.get, {
      symbol: args.symbol,
      interval: args.interval,
    });
    if (cached) return cached;

    const config = INTERVAL_CONFIG[args.interval];
    if (!config) return null;

    let limit = config.limit;
    if (args.interval === "YTD") {
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      limit = Math.ceil(
        (now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    const url = binanceApiUrl(
      `/api/v3/klines?symbol=${toBinanceSymbol(args.symbol)}&interval=${config.interval}&limit=${limit}`,
    );
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const closes = data.map((c: string[]) => parseFloat(c[4]));
    const basePrice = closes[0];
    const latestPrice = closes[closes.length - 1];
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);

    const result = { closes, basePrice, latestPrice, minPrice, maxPrice };

    await ctx.runMutation(internal.chartCache.set, {
      symbol: args.symbol,
      interval: args.interval,
      ...result,
    });

    return result;
  },
});

export const getPrice = action({
  args: { symbol: v.string() },
  handler: async (_ctx, args) => {
    if (!SUPPORTED_SYMBOLS.has(args.symbol)) return null;

    const res = await fetch(
      binanceApiUrl(
        `/api/v3/ticker/24hr?symbol=${toBinanceSymbol(args.symbol)}`,
      ),
    );
    if (!res.ok) return null;

    const data = await res.json();
    const price = parseFloat(data.lastPrice);
    if (isNaN(price)) return null;

    return {
      price,
      priceChange24h: parseFloat(data.priceChangePercent) || 0,
      volume: parseFloat(data.quoteVolume) || 0,
      symbol: args.symbol,
    };
  },
});

export const getAllPrices = action({
  args: {},
  handler: async () => {
    const res = await fetch(binanceApiUrl("/api/v3/ticker/24hr"));
    if (!res.ok) return {};

    const data: Array<{
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
    }> = await res.json();

    const usdtSuffix = "USDT";
    const prices: Record<
      string,
      { price: number; priceChange24h: number }
    > = {};

    for (const ticker of data) {
      if (!ticker.symbol.endsWith(usdtSuffix)) continue;
      const base = ticker.symbol.slice(0, -usdtSuffix.length);
      if (!SUPPORTED_SYMBOLS.has(base)) continue;
      const price = parseFloat(ticker.lastPrice);
      if (isNaN(price)) continue;
      prices[base] = {
        price,
        priceChange24h: parseFloat(ticker.priceChangePercent) || 0,
      };
    }

    return prices;
  },
});
