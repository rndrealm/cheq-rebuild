// Checkpoint poller: every 30s (see crons.ts) fetches market data for every
// supported token, saves it (market.ts) and records new checkpoints in
// `betEvents`. Detection rules live in lib/checkpoints.ts.
import {
  internalAction,
  internalMutation,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { detectCheckpoints } from "./lib/checkpoints";
import { optionalAuthQuery } from "./lib/functions";
import { SUPPORTED_TOKENS } from "./lib/constants";
import { fetchMarketTickers } from "./lib/market";

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

// Upper bound on events in the dashboard's Updates list.
const FEED_EVENTS = 10;

// The caller's newest checkpoints across their bets, for the dashboard's
// Updates list: each with its bet, which side the caller is on and the
// rival's username, so the client can word it from their side. Empty when
// logged out.
export const myFeed = optionalAuthQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];
    const me = ctx.user._id;

    const [asCreator, asOpponent] = await Promise.all([
      ctx.db
        .query("betEvents")
        .withIndex("by_creatorId_and_at", (q) => q.eq("creatorId", me))
        .order("desc")
        .take(FEED_EVENTS),
      ctx.db
        .query("betEvents")
        .withIndex("by_opponentId_and_at", (q) => q.eq("opponentId", me))
        .order("desc")
        .take(FEED_EVENTS),
    ]);
    const events = [...asCreator, ...asOpponent]
      .sort((a, b) => b.at - a.at)
      .slice(0, FEED_EVENTS);

    const names = new Map<Id<"users">, string | null>();
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
      const isCreator = bet.creatorId === me;
      rows.push({
        event,
        bet,
        isCreator,
        rival: await nameOf(isCreator ? bet.opponentId : bet.creatorId),
      });
    }
    return rows;
  },
});

// One-off: copies each bet's players onto checkpoints recorded before
// betEvents had them. Run once per deployment after deploying:
//   npx convex run checkpoints:backfillPlayers
// Re-run until it returns 0 (each run handles one batch).
export const backfillPlayers = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const missing = await ctx.db
      .query("betEvents")
      .withIndex("by_creatorId_and_at", (q) => q.eq("creatorId", undefined))
      .take(200);
    for (const event of missing) {
      const bet = await ctx.db.get(event.betId);
      // The bet is gone, so the checkpoint can't be shown anywhere.
      if (!bet) {
        await ctx.db.delete(event._id);
        continue;
      }
      await ctx.db.patch(event._id, {
        creatorId: bet.creatorId,
        opponentId: bet.opponentId,
      });
    }
    return missing.length;
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
          creatorId: bet.creatorId,
          opponentId: bet.opponentId,
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

// Every 30s: one Binance call for all supported tokens. Saves the market
// snapshot the app reads, then records checkpoints for live bets at those
// prices.
export const poll = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const tickers = await fetchMarketTickers(SUPPORTED_TOKENS);
    if (tickers.length === 0) return null;

    await ctx.runMutation(internal.market.saveSnapshot, { tickers });

    const prices = Object.fromEntries(
      tickers.map((ticker) => [ticker.symbol, ticker.price]),
    );
    await ctx.runMutation(internal.checkpoints.recordCheckpoints, { prices });
    return null;
  },
});
