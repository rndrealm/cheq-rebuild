"use node";

// eslint-disable-next-line no-restricted-imports -- public market data, used logged-out
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

// Candle sizes for bet charts, smallest first. A bet's window gets the
// smallest one that keeps it under MAX_BET_CHART_POINTS candles: 1h and 4h
// bets get 1m candles, 24h gets 5m, 3d gets 15m, 1w gets 30m.
const BET_CHART_INTERVALS: { interval: string; ms: number }[] = [
  { interval: "1m", ms: 60_000 },
  { interval: "3m", ms: 3 * 60_000 },
  { interval: "5m", ms: 5 * 60_000 },
  { interval: "15m", ms: 15 * 60_000 },
  { interval: "30m", ms: 30 * 60_000 },
  { interval: "1h", ms: 60 * 60_000 },
  { interval: "2h", ms: 2 * 60 * 60_000 },
];
const MAX_BET_CHART_POINTS = 400;
// Longest bet is 1w; allow some slack, but no arbitrary history requests.
const MAX_BET_WINDOW_MS = 8 * 24 * 60 * 60_000;

// Prices for one token across a bet's window, from `startTime` up to now (or
// `endTime` if it has passed). The last close is the live price. Public market
// data, like `getChartData`.
export const getBetChart = action({
  args: {
    symbol: v.string(),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (
    _ctx,
    args,
  ): Promise<{ times: number[]; closes: number[] } | null> => {
    if (!SUPPORTED_SYMBOLS.has(args.symbol)) return null;
    const windowMs = args.endTime - args.startTime;
    if (windowMs <= 0 || windowMs > MAX_BET_WINDOW_MS) return null;

    const now = Date.now();
    const end = Math.min(now, args.endTime);
    if (end <= args.startTime) return { times: [], closes: [] };

    const { interval } =
      BET_CHART_INTERVALS.find(
        (c) => windowMs / c.ms <= MAX_BET_CHART_POINTS,
      ) ?? BET_CHART_INTERVALS[BET_CHART_INTERVALS.length - 1];

    const url = binanceApiUrl(
      `/api/v3/klines?symbol=${toBinanceSymbol(args.symbol)}&interval=${interval}&startTime=${args.startTime}&endTime=${end}&limit=1000`,
    );
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data)) return null;

    // Kline rows: [openTime, open, high, low, close, ...]. The newest candle
    // is still open, so its close is the current price; stamp it with `end`.
    const times = data.map((c: [number, ...unknown[]]) => c[0]);
    const closes = data.map((c: string[]) => parseFloat(c[4]));
    if (times.length > 0) times[times.length - 1] = end;

    return { times, closes };
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
