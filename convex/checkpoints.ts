// Checkpoint poller: every 30s (see crons.ts) prices every token with a live
// bet and records new checkpoints in `betEvents`. Detection rules live in
// lib/checkpoints.ts.
import {
  internalAction,
  internalMutation,
  internalQuery,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { detectCheckpoints } from "./lib/checkpoints";
import { optionalAuthQuery } from "./lib/functions";
import { fetchPrices } from "./lib/prices";

// Upper bound on live bets processed per run. Well above today's volume; if
// it's ever reached, the bets ending soonest are processed first.
const MAX_BETS_PER_RUN = 500;
// Upper bound on events read per bet (lead changes are capped at 12).
const MAX_EVENTS_PER_BET = 50;

async function liveBets(ctx: QueryCtx, now: number) {
  return await ctx.db
    .query("bets")
    .withIndex("by_status_resolvesAt", (q) =>
      q.eq("status", "active").gt("resolvesAt", now),
    )
    .take(MAX_BETS_PER_RUN);
}

// A bet's checkpoints, newest first. Only the two players can read them; for
// anyone else (or when logged out) it's an empty list. Reactive, so a widget
// showing the bet gets new checkpoints as the poller records them.
export const listForBet = optionalAuthQuery({
  args: { betId: v.id("bets") },
  handler: async (ctx, args) => {
    if (!ctx.user) return [];
    const bet = await ctx.db.get(args.betId);
    if (!bet) return [];
    const isPlayer =
      bet.creatorId === ctx.user._id || bet.opponentId === ctx.user._id;
    if (!isPlayer) return [];

    const events = await ctx.db
      .query("betEvents")
      .withIndex("by_betId_and_key", (q) => q.eq("betId", args.betId))
      .take(MAX_EVENTS_PER_BET);
    return events.sort((a, b) => b.at - a.at);
  },
});

// Upper bound on events in the dashboard feed.
const FEED_EVENTS = 10;

// The newest checkpoints across all bets, for the dashboard feed, each with
// its bet and both players' names so the client can word it in the third
// person. Signed-in users only (empty when logged out); the bets themselves
// are already public via bets.feed.
export const recentFeed = optionalAuthQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];
    const events = await ctx.db
      .query("betEvents")
      .withIndex("by_at")
      .order("desc")
      .take(FEED_EVENTS);

    const names = new Map<string, string | null>();
    const nameOf = async (id: Id<"users"> | undefined) => {
      if (!id) return null;
      if (!names.has(id)) {
        const user = await ctx.db.get(id);
        names.set(id, user ? user.username : null);
      }
      return names.get(id) ?? null;
    };

    const rows = [];
    for (const event of events) {
      const bet = await ctx.db.get(event.betId);
      if (!bet) continue;
      rows.push({
        event,
        bet,
        creator: await nameOf(bet.creatorId),
        opponent: await nameOf(bet.opponentId),
      });
    }
    return rows;
  },
});

// Tokens that need a price this run.
export const liveSymbols = internalQuery({
  args: { now: v.number() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const symbols = new Set<string>();
    for (const bet of await liveBets(ctx, args.now)) {
      symbols.add(bet.token.symbol);
      if (bet.tokenB) symbols.add(bet.tokenB.symbol);
    }
    return [...symbols];
  },
});

// Records new checkpoints for every live bet at these prices. Re-reads each
// bet and its events in this transaction, so overlapping runs can't record a
// checkpoint twice. Bets whose token(s) have no price this run are skipped.
export const recordCheckpoints = internalMutation({
  args: { prices: v.record(v.string(), v.number()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now();
    let recorded = 0;

    for (const bet of await liveBets(ctx, now)) {
      const priceA = args.prices[bet.token.symbol];
      const priceB = bet.tokenB ? args.prices[bet.tokenB.symbol] : undefined;
      if (priceA === undefined) continue;
      if (bet.tokenB && priceB === undefined) continue;

      const fired = await ctx.db
        .query("betEvents")
        .withIndex("by_betId_and_key", (q) => q.eq("betId", bet._id))
        .take(MAX_EVENTS_PER_BET);

      const found = detectCheckpoints({ bet, priceA, priceB, now, fired });
      for (const checkpoint of found) {
        await ctx.db.insert("betEvents", {
          betId: bet._id,
          ...checkpoint,
          at: now,
          price: priceA,
          priceB,
        });
        recorded++;
      }
    }

    return recorded;
  },
});

export const poll = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const symbols: string[] = await ctx.runQuery(
      internal.checkpoints.liveSymbols,
      { now: Date.now() },
    );
    if (symbols.length === 0) return null;

    const prices = await fetchPrices(symbols);
    if (Object.keys(prices).length === 0) return null;

    await ctx.runMutation(internal.checkpoints.recordCheckpoints, { prices });
    return null;
  },
});
