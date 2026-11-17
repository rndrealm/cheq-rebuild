"use node";

// eslint-disable-next-line no-restricted-imports -- public market data, used logged-out
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  SUPPORTED_SYMBOLS,
  binanceApiUrl,
  fetchBinance,
  toBinanceSymbol,
} from "./lib/tokens";
import { SUPPORTED_TOKENS } from "./lib/constants";
import { fetchMarketTickers } from "./lib/market";
import {
  CHART_POINTS,
  chartPointValidator,
  downsample,
  parseKlines,
  type ChartPoint,
} from "./lib/chart";

// Candles per chart range. Each range has at least CHART_POINTS candles
// (except YTD early in the year), so hovering lands on real closes.
const INTERVAL_CONFIG: Record<string, { interval: string; limit: number }> = {
  "1D": { interval: "15m", limit: 96 },
  "1W": { interval: "1h", limit: 168 },
  "1M": { interval: "4h", limit: 180 },
  "6M": { interval: "1d", limit: 180 },
  "1Y": { interval: "1d", limit: 365 },
  YTD: { interval: "1d", limit: 0 },
  // Binance's max; covers every supported token's full weekly history.
  All: { interval: "1w", limit: 1000 },
};

// A token's chart for a range: real candle closes with their times, oldest
// first, at most CHART_POINTS of them. Cached per range (chartSeries.ts).
export const getChartData = action({
  args: {
    symbol: v.string(),
    interval: v.string(),
  },
  returns: v.union(v.array(chartPointValidator), v.null()),
  handler: async (ctx, args): Promise<ChartPoint[] | null> => {
    if (!SUPPORTED_SYMBOLS.has(args.symbol)) return null;
    const config = INTERVAL_CONFIG[args.interval];
    if (!config) return null;

    const cached = await ctx.runQuery(internal.chartSeries.get, {
      symbol: args.symbol,
      interval: args.interval,
    });
    if (cached) return cached;

    let limit = config.limit;
    if (args.interval === "YTD") {
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      limit = Math.max(
        1,
        Math.ceil(
          (now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
    }

    const url = binanceApiUrl(
      `/api/v3/klines?symbol=${toBinanceSymbol(args.symbol)}&interval=${config.interval}&limit=${limit}`,
    );
    const res = await fetchBinance(url);
    if (!res?.ok) return null;

    const points = downsample(
      parseKlines(await res.json(), Date.now()),
      CHART_POINTS,
    );
    if (points.length === 0) return null;

    await ctx.runMutation(internal.chartSeries.set, {
      symbol: args.symbol,
      interval: args.interval,
      points,
    });
    return points;
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
    const res = await fetchBinance(url);
    if (!res?.ok) return null;

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

// Only the demo token picker still calls this; the app reads market.snapshot.
export const getAllPrices = action({
  args: {},
  handler: async () => {
    const tickers = await fetchMarketTickers(SUPPORTED_TOKENS);
    const prices: Record<string, { price: number; priceChange24h: number }> =
      {};
    for (const { symbol, price, priceChange24h } of tickers) {
      prices[symbol] = { price, priceChange24h };
    }
    return prices;
  },
});
