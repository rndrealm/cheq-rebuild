import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const INTERVAL_TTL_MS: Record<string, number> = {
  "1D": 2 * 60 * 1000,
  "1W": 10 * 60 * 1000,
  "1M": 30 * 60 * 1000,
  "1Y": 60 * 60 * 1000,
  YTD: 30 * 60 * 1000,
  All: 60 * 60 * 1000,
};

export const get = internalQuery({
  args: {
    symbol: v.string(),
    interval: v.string(),
  },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("chartCache")
      .withIndex("by_symbol_and_interval", (q) =>
        q.eq("symbol", args.symbol).eq("interval", args.interval),
      )
      .unique();

    if (!cached) return null;

    const ttl = INTERVAL_TTL_MS[args.interval] ?? 10 * 60 * 1000;
    if (Date.now() - cached.fetchedAt > ttl) return null;

    return {
      closes: cached.closes,
      basePrice: cached.basePrice,
      latestPrice: cached.latestPrice,
      minPrice: cached.minPrice,
      maxPrice: cached.maxPrice,
    };
  },
});

export const set = internalMutation({
  args: {
    symbol: v.string(),
    interval: v.string(),
    closes: v.array(v.number()),
    basePrice: v.number(),
    latestPrice: v.number(),
    minPrice: v.number(),
    maxPrice: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chartCache")
      .withIndex("by_symbol_and_interval", (q) =>
        q.eq("symbol", args.symbol).eq("interval", args.interval),
      )
      .unique();

    const doc = {
      symbol: args.symbol,
      interval: args.interval,
      closes: args.closes,
      basePrice: args.basePrice,
      latestPrice: args.latestPrice,
      minPrice: args.minPrice,
      maxPrice: args.maxPrice,
      fetchedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.replace(existing._id, doc);
    } else {
      await ctx.db.insert("chartCache", doc);
    }
  },
});
