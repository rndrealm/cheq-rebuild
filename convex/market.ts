// The latest market data for our tokens, one row per token, overwritten in
// place by the checkpoint poller every 30s. Never grows: at most one row per
// supported token. The app reads it with a reactive query instead of each
// browser tab polling Binance.
import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import schema from "./schema";
import type { MarketTicker } from "./lib/market";

const tickerValidator = schema.tables.marketPrices.validator.omit("updatedAt");

// Bounded: there are 24 supported tokens.
const MAX_TOKENS = 100;

// Public market data, also shown logged-out.
export const snapshot = query({
  args: {},
  returns: v.array(
    schema.tables.marketPrices.validator.extend({
      _id: v.id("marketPrices"),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("marketPrices").take(MAX_TOKENS);
  },
});

const sameTicker = (a: MarketTicker, b: MarketTicker) =>
  a.price === b.price &&
  a.priceChange24h === b.priceChange24h &&
  a.priceChangeAbs24h === b.priceChangeAbs24h &&
  a.open24h === b.open24h &&
  a.high24h === b.high24h &&
  a.low24h === b.low24h &&
  a.volume === b.volume;

// Upserts each ticker. Unchanged rows aren't rewritten, so subscribers only
// get an update when something actually moved.
export const saveSnapshot = internalMutation({
  args: { tickers: v.array(tickerValidator) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now();
    let written = 0;

    for (const ticker of args.tickers) {
      const existing = await ctx.db
        .query("marketPrices")
        .withIndex("by_symbol", (q) => q.eq("symbol", ticker.symbol))
        .unique();

      if (!existing) {
        await ctx.db.insert("marketPrices", { ...ticker, updatedAt: now });
        written++;
      } else if (!sameTicker(existing, ticker)) {
        await ctx.db.patch(existing._id, { ...ticker, updatedAt: now });
        written++;
      }
    }

    return written;
  },
});
