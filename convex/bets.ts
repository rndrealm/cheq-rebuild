import { query, internalMutation, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authedMutation, optionalAuthQuery } from "./lib/functions";
import { isTargetHit } from "./lib/touch";
import {
  MIN_WAGER,
  MAX_WAGER,
  MAX_ACTIVE_BETS,
  MAX_COUNTER_ROUNDS,
  CHALLENGE_EXPIRY_MS,
  DURATION_MS,
} from "./lib/constants";

const tokenValidator = v.object({
  symbol: v.string(),
});

const betTypeValidator = v.union(
  v.literal("up_down"),
  v.literal("hit_price"),
  v.literal("token_vs_token"),
);

const statusValidator = v.union(
  v.literal("pending"),
  v.literal("countered"),
  v.literal("active"),
  v.literal("resolved"),
  v.literal("tied"),
  v.literal("expired"),
  v.literal("cancelled"),
  v.literal("flagged"),
);

const durationValidator = v.union(
  v.literal("1h"),
  v.literal("4h"),
  v.literal("24h"),
  v.literal("3d"),
  v.literal("1w"),
);

export const getById = query({
  args: { betId: v.id("bets") },
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    return bet ?? null;
  },
});

export const detail = query({
  args: { betId: v.id("bets") },
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) return null;

    const creator = await ctx.db.get(bet.creatorId);
    const opponent = bet.opponentId
      ? await ctx.db.get(bet.opponentId)
      : null;

    return {
      ...bet,
      creator: creator
        ? { name: creator.name, username: creator.username }
        : null,
      opponent: opponent
        ? { id: opponent._id, name: opponent.name, username: opponent.username }
        : null,
    };
  },
});

export const feed = query({
  args: {},
  handler: async (ctx) => {
    const bets = await ctx.db.query("bets").order("desc").take(50);

    const userIds = new Set<string>();
    for (const bet of bets) {
      userIds.add(bet.creatorId);
      if (bet.opponentId) userIds.add(bet.opponentId);
    }

    const usersMap: Record<string, { name: string; username: string }> = {};
    for (const id of userIds) {
      const user = await ctx.db.get(id as Id<"users">);
      if (user) usersMap[id] = { name: user.name, username: user.username };
    }

    return bets.map((bet) => ({
      ...bet,
      creator: usersMap[bet.creatorId] ?? null,
      opponent: bet.opponentId ? (usersMap[bet.opponentId] ?? null) : null,
    }));
  },
});

// All the caller's bets (either side), newest first, each with both players'
// names. Powers Feed and the home balance. Returns [] when logged out so the
// live query doesn't throw during sign-out.
export const mine = optionalAuthQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];
    const userId = ctx.user._id;

    const [asCreator, asOpponent] = await Promise.all([
      ctx.db
        .query("bets")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", userId))
        .collect(),
      ctx.db
        .query("bets")
        .withIndex("by_opponentId", (q) => q.eq("opponentId", userId))
        .collect(),
    ]);

    const allBets = [...asCreator, ...asOpponent].sort(
      (a, b) => b._creationTime - a._creationTime,
    );

    const userIds = new Set<string>();
    for (const bet of allBets) {
      userIds.add(bet.creatorId);
      if (bet.opponentId) userIds.add(bet.opponentId);
    }

    const usersMap: Record<string, { name: string; username: string }> = {};
    for (const id of userIds) {
      const user = await ctx.db.get(id as Id<"users">);
      if (user) usersMap[id] = { name: user.name, username: user.username };
    }

    return allBets.map((bet) => ({
      ...bet,
      creator: usersMap[bet.creatorId] ?? null,
      opponent: bet.opponentId ? (usersMap[bet.opponentId] ?? null) : null,
    }));
  },
});

// Upper bound on bets read per (side, status) for the balance. Live bets are
// capped by MAX_ACTIVE_BETS and open challenges expire, so this is headroom.
const MAX_LOCKED_BETS = 100;

// The caller's balance: available points plus points held in bets, i.e. their
// stake in every live bet on either side, in open challenges they created
// (the opponent only pays on accept) and in flagged bets, whose stakes stay
// held until resolved by hand. Null when logged out.
export const myBalance = optionalAuthQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({ available: v.number(), locked: v.number(), total: v.number() }),
  ),
  handler: async (ctx) => {
    if (!ctx.user) return null;
    const me = ctx.user._id;

    const asCreator = (["active", "flagged", "pending", "countered"] as const).map(
      (status) =>
        ctx.db
          .query("bets")
          .withIndex("by_creatorId_status", (q) =>
            q.eq("creatorId", me).eq("status", status),
          )
          .take(MAX_LOCKED_BETS),
    );
    const asOpponent = (["active", "flagged"] as const).map((status) =>
      ctx.db
        .query("bets")
        .withIndex("by_opponentId_status", (q) =>
          q.eq("opponentId", me).eq("status", status),
        )
        .take(MAX_LOCKED_BETS),
    );

    const [created, joined] = await Promise.all([
      Promise.all(asCreator),
      Promise.all(asOpponent),
    ]);
    const locked =
      created.flat().reduce((sum, bet) => sum + bet.creatorWager, 0) +
      joined.flat().reduce((sum, bet) => sum + bet.opponentWager, 0);

    const available = ctx.user.points;
    return { available, locked, total: available + locked };
  },
});

// The caller's live bets (either side), soonest to resolve first, each with
// the other player's profile. Powers the dashboard's main widget. Returns []
// when logged out so the live query doesn't throw during sign-out.
export const myActive = optionalAuthQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];
    const userId = ctx.user._id;

    // Active bets are capped by MAX_ACTIVE_BETS; take a little more as headroom
    // for bets accepted before the cap existed.
    const limit = MAX_ACTIVE_BETS * 2;
    const [asCreator, asOpponent] = await Promise.all([
      ctx.db
        .query("bets")
        .withIndex("by_creatorId_status", (q) =>
          q.eq("creatorId", userId).eq("status", "active"),
        )
        .take(limit),
      ctx.db
        .query("bets")
        .withIndex("by_opponentId_status", (q) =>
          q.eq("opponentId", userId).eq("status", "active"),
        )
        .take(limit),
    ]);

    const bets = [...asCreator, ...asOpponent].sort(
      (a, b) => a.resolvesAt - b.resolvesAt,
    );

    return await Promise.all(
      bets.map(async (bet) => {
        const isCreator = bet.creatorId === userId;
        const rivalId = isCreator ? bet.opponentId : bet.creatorId;
        const rival = rivalId ? await ctx.db.get(rivalId) : null;
        return {
          ...bet,
          isCreator,
          rival: rival
            ? { id: rival._id, name: rival.name, username: rival.username }
            : null,
        };
      }),
    );
  },
});

export const listByUser = query({
  args: {
    userId: v.id("users"),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, args) => {
    const asCreator = args.status
      ? await ctx.db
          .query("bets")
          .withIndex("by_creatorId_status", (q) =>
            q.eq("creatorId", args.userId).eq("status", args.status!),
          )
          .collect()
      : await ctx.db
          .query("bets")
          .withIndex("by_creatorId", (q) => q.eq("creatorId", args.userId))
          .collect();

    const asOpponent = args.status
      ? await ctx.db
          .query("bets")
          .withIndex("by_opponentId_status", (q) =>
            q.eq("opponentId", args.userId).eq("status", args.status!),
          )
          .collect()
      : await ctx.db
          .query("bets")
          .withIndex("by_opponentId", (q) => q.eq("opponentId", args.userId))
          .collect();

    return [...asCreator, ...asOpponent];
  },
});

// Internal: called by `betActions.createBet`, which resolves `creatorId` from
// the session.
export const create = internalMutation({
  args: {
    creatorId: v.id("users"),
    opponentId: v.optional(v.id("users")),
    type: betTypeValidator,
    token: tokenValidator,
    tokenB: v.optional(tokenValidator),
    betTerms: v.object({
      direction: v.optional(v.union(v.literal("up"), v.literal("down"))),
      targetPrice: v.optional(v.number()),
      creatorSide: v.optional(
        v.union(v.literal("tokenA"), v.literal("tokenB")),
      ),
    }),
    wager: v.number(),
    priceAtCreation: v.number(),
    priceAtCreationB: v.optional(v.number()),
    duration: durationValidator,
  },
  returns: v.id("bets"),
  handler: async (ctx, args) => {
    if (args.wager < MIN_WAGER || args.wager > MAX_WAGER) {
      throw new Error(`Wager must be between ${MIN_WAGER} and ${MAX_WAGER}`);
    }

    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error("Creator not found");
    if (creator.points < args.wager) throw new Error("Insufficient points");

    if (args.opponentId) {
      if (args.opponentId === args.creatorId) {
        throw new Error("Cannot challenge yourself");
      }
      const opponent = await ctx.db.get(args.opponentId);
      if (!opponent) throw new Error("Opponent not found");
    }

    await assertUnderBetLimit(ctx, args.creatorId);

    if (args.type === "token_vs_token" && !args.tokenB) {
      throw new Error("Token vs token bets require a second token");
    }

    const now = Date.now();
    const durationMs = DURATION_MS[args.duration];
    const resolvesAt = now + durationMs;
    const expiresAt = Math.min(now + CHALLENGE_EXPIRY_MS, resolvesAt);

    await ctx.db.patch(args.creatorId, {
      points: creator.points - args.wager,
    });

    await ctx.db.insert("pointTransactions", {
      userId: args.creatorId,
      amount: -args.wager,
      type: "bet_lock",
    });

    const betId = await ctx.db.insert("bets", {
      creatorId: args.creatorId,
      opponentId: args.opponentId,
      type: args.type,
      status: "pending",
      token: args.token,
      tokenB: args.tokenB,
      betTerms: args.betTerms,
      creatorWager: args.wager,
      opponentWager: args.wager,
      priceAtCreation: args.priceAtCreation,
      priceAtCreationB: args.priceAtCreationB,
      duration: args.duration,
      expiresAt,
      resolvesAt,
      counterCount: 0,
      updatedAt: now,
    });

    await ctx.scheduler.runAt(
      expiresAt,
      internal.resolution.expireStaleChallenge,
      { betId },
    );

    if (args.opponentId) {
      await ctx.db.insert("notifications", {
        userId: args.opponentId,
        type: "challenge_received",
        title: "New Challenge!",
        body: `You've been challenged on ${args.token.symbol}`,
        betId,
        read: false,
      });
    }

    return betId;
  },
});

// Internal: called by `betActions.acceptBet`, which resolves `userId` from the
// session and fetches the start price. The bet starts now: the start price and
// a fresh `resolvesAt` (now + duration) are set here.
export const accept = internalMutation({
  args: {
    betId: v.id("bets"),
    userId: v.id("users"),
    priceAtStart: v.number(),
    priceAtStartB: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    if (bet.status !== "pending" && bet.status !== "countered") {
      throw new Error("Bet is not available for acceptance");
    }
    if (bet.opponentId && bet.opponentId !== user._id) {
      throw new Error("This challenge is not for you");
    }
    if (bet.creatorId === user._id) {
      throw new Error("Cannot accept your own bet");
    }

    const now = Date.now();
    if (now > bet.expiresAt) throw new Error("Challenge has expired");

    if (user.points < bet.opponentWager) throw new Error("Insufficient points");
    await assertUnderBetLimit(ctx, user._id);

    // An Over/under bet whose target is already reached would be decided
    // before it starts.
    if (bet.type === "hit_price" && isTargetHit(bet.betTerms, args.priceAtStart)) {
      throw new Error("Target price already reached");
    }

    await ctx.db.patch(user._id, {
      points: user.points - bet.opponentWager,
    });

    await ctx.db.insert("pointTransactions", {
      userId: user._id,
      amount: -bet.opponentWager,
      type: "bet_lock",
      betId: args.betId,
    });

    const resolvesAt = now + DURATION_MS[bet.duration];
    await ctx.db.patch(args.betId, {
      status: "active",
      opponentId: user._id,
      priceAtStart: args.priceAtStart,
      priceAtStartB: args.priceAtStartB,
      startedAt: now,
      resolvesAt,
      updatedAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: bet.creatorId,
      type: "challenge_accepted",
      title: "Challenge Accepted!",
      body: `Your ${bet.token.symbol} challenge was accepted`,
      betId: args.betId,
      read: false,
    });

    // hit_price bets are also settled early by the touch poller; at the
    // deadline, an untouched one goes to the opponent.
    await ctx.scheduler.runAt(
      resolvesAt,
      bet.type === "hit_price"
        ? internal.resolutionHelpers.settleTouchDeadline
        : internal.resolution.resolveSnapshot,
      { betId: args.betId },
    );

    return null;
  },
});

export const decline = authedMutation({
  args: {
    betId: v.id("bets"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    if (bet.status !== "pending" && bet.status !== "countered") {
      throw new Error("Bet cannot be declined");
    }
    // Only a named opponent can decline. Open challenges have no one to
    // decline them; the creator uses `cancel`.
    if (!bet.opponentId || bet.opponentId !== ctx.user._id) {
      throw new Error("This challenge is not for you");
    }

    const creator = await ctx.db.get(bet.creatorId);
    if (!creator) throw new Error("Creator not found");

    await ctx.db.patch(bet.creatorId, {
      points: creator.points + bet.creatorWager,
    });

    await ctx.db.insert("pointTransactions", {
      userId: bet.creatorId,
      amount: bet.creatorWager,
      type: "bet_unlock",
      betId: args.betId,
    });

    await ctx.db.patch(args.betId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: bet.creatorId,
      type: "challenge_declined",
      title: "Challenge Declined",
      body: `Your ${bet.token.symbol} challenge was declined`,
      betId: args.betId,
      read: false,
    });

    return null;
  },
});

export const counter = authedMutation({
  args: {
    betId: v.id("bets"),
    newWager: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    if (bet.status !== "pending" && bet.status !== "countered") {
      throw new Error("Bet cannot be countered");
    }
    if (bet.counterCount >= MAX_COUNTER_ROUNDS) {
      throw new Error("Maximum counter rounds reached");
    }
    if (args.newWager < MIN_WAGER || args.newWager > MAX_WAGER) {
      throw new Error(`Wager must be between ${MIN_WAGER} and ${MAX_WAGER}`);
    }

    const now = Date.now();
    if (now > bet.expiresAt) throw new Error("Challenge has expired");

    const isCreator = bet.creatorId === ctx.user._id;
    const isOpponent = bet.opponentId === ctx.user._id;
    if (!isCreator && !isOpponent) {
      throw new Error("You are not part of this bet");
    }

    const notifyUserId = isCreator ? bet.opponentId : bet.creatorId;

    if (isCreator) {
      const creator = ctx.user;
      const diff = args.newWager - bet.creatorWager;
      if (diff > 0 && creator.points < diff) {
        throw new Error("Insufficient points for higher wager");
      }
      await ctx.db.patch(bet.creatorId, {
        points: creator.points - diff,
      });
      if (diff !== 0) {
        await ctx.db.insert("pointTransactions", {
          userId: bet.creatorId,
          amount: -diff,
          type: diff > 0 ? "bet_lock" : "bet_unlock",
          betId: args.betId,
        });
      }
    }

    await ctx.db.patch(args.betId, {
      status: "countered",
      opponentWager: args.newWager,
      creatorWager: args.newWager,
      counterCount: bet.counterCount + 1,
      updatedAt: now,
    });

    if (notifyUserId) {
      await ctx.db.insert("notifications", {
        userId: notifyUserId,
        type: "counter_received",
        title: "Counter Proposal",
        body: `New wager proposed: ${args.newWager} points on ${bet.token.symbol}`,
        betId: args.betId,
        read: false,
      });
    }

    return null;
  },
});

export const cancel = authedMutation({
  args: {
    betId: v.id("bets"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    if (bet.creatorId !== ctx.user._id) {
      throw new Error("Only the creator can cancel a bet");
    }
    if (bet.status !== "pending" && bet.status !== "countered") {
      throw new Error("Only pending bets can be cancelled");
    }

    const creator = ctx.user;

    await ctx.db.patch(bet.creatorId, {
      points: creator.points + bet.creatorWager,
    });

    await ctx.db.insert("pointTransactions", {
      userId: bet.creatorId,
      amount: bet.creatorWager,
      type: "bet_unlock",
      betId: args.betId,
    });

    await ctx.db.patch(args.betId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const rematch = authedMutation({
  args: {
    betId: v.id("bets"),
  },
  returns: v.id("bets"),
  handler: async (ctx, args) => {
    const userId = ctx.user._id;
    const original = await ctx.db.get(args.betId);
    if (!original) throw new Error("Bet not found");
    if (original.status !== "resolved" && original.status !== "tied") {
      throw new Error("Can only rematch resolved bets");
    }

    const isCreator = original.creatorId === userId;
    const isOpponent = original.opponentId === userId;
    if (!isCreator && !isOpponent) {
      throw new Error("You are not part of this bet");
    }

    const opponentId = isCreator
      ? original.opponentId
      : original.creatorId;
    const wager = original.creatorWager;

    const creator = ctx.user;
    if (creator.points < wager) throw new Error("Insufficient points");

    await assertUnderBetLimit(ctx, userId);

    const now = Date.now();
    const durationMs = DURATION_MS[original.duration];
    const resolvesAt = now + durationMs;
    const expiresAt = Math.min(now + CHALLENGE_EXPIRY_MS, resolvesAt);

    await ctx.db.patch(userId, {
      points: creator.points - wager,
    });
    await ctx.db.insert("pointTransactions", {
      userId,
      amount: -wager,
      type: "bet_lock",
    });

    const betId = await ctx.db.insert("bets", {
      creatorId: userId,
      opponentId: opponentId,
      type: original.type,
      status: "pending",
      token: original.token,
      tokenB: original.tokenB,
      betTerms: original.betTerms,
      creatorWager: wager,
      opponentWager: wager,
      priceAtCreation: original.priceAtCreation,
      priceAtCreationB: original.priceAtCreationB,
      duration: original.duration,
      expiresAt,
      resolvesAt,
      counterCount: 0,
      updatedAt: now,
    });

    await ctx.scheduler.runAt(
      expiresAt,
      internal.resolution.expireStaleChallenge,
      { betId },
    );

    if (opponentId) {
      await ctx.db.insert("notifications", {
        userId: opponentId,
        type: "challenge_received",
        title: "Rematch!",
        body: `You've been challenged to a rematch on ${original.token.symbol}`,
        betId,
        read: false,
      });
    }

    return betId;
  },
});

// Counts every bet the user has points locked in: challenges they created that
// are still open (pending / countered) and active bets on either side.
// Incoming challenges they haven't accepted don't count, so others can't fill
// someone's slots by challenging them.
async function assertUnderBetLimit(ctx: QueryCtx, userId: Id<"users">) {
  const counts = await Promise.all([
    ...(["pending", "countered", "active"] as const).map((status) =>
      ctx.db
        .query("bets")
        .withIndex("by_creatorId_status", (q) =>
          q.eq("creatorId", userId).eq("status", status),
        )
        .take(MAX_ACTIVE_BETS),
    ),
    ctx.db
      .query("bets")
      .withIndex("by_opponentId_status", (q) =>
        q.eq("opponentId", userId).eq("status", "active"),
      )
      .take(MAX_ACTIVE_BETS),
  ]);
  const total = counts.reduce((sum, bets) => sum + bets.length, 0);
  if (total >= MAX_ACTIVE_BETS) {
    throw new Error(`Maximum ${MAX_ACTIVE_BETS} active bets allowed`);
  }
}
