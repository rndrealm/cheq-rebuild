import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import {
  CHART_TTL_MS,
  DEFAULT_CHART_TTL_MS,
  chartPointValidator,
} from "./lib/chart";

// The cached points, or null if there are none or they've expired.
export const get = internalQuery({
  args: {
    symbol: v.string(),
    interval: v.string(),
  },
  returns: v.union(v.array(chartPointValidator), v.null()),
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("chartSeries")
      .withIndex("by_symbol_and_interval", (q) =>
        q.eq("symbol", args.symbol).eq("interval", args.interval),
      )
      .unique();

    if (!cached) return null;

    const ttl = CHART_TTL_MS[args.interval] ?? DEFAULT_CHART_TTL_MS;
    if (Date.now() - cached.fetchedAt > ttl) return null;

    return cached.points;
  },
});

export const set = internalMutation({
  args: {
    symbol: v.string(),
    interval: v.string(),
    points: v.array(chartPointValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chartSeries")
      .withIndex("by_symbol_and_interval", (q) =>
        q.eq("symbol", args.symbol).eq("interval", args.interval),
      )
      .unique();

    const doc = { ...args, fetchedAt: Date.now() };
    if (existing) {
      await ctx.db.replace(existing._id, doc);
    } else {
      await ctx.db.insert("chartSeries", doc);
    }
    return null;
  },
});
