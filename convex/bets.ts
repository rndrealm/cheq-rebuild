import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  MIN_WAGER,
  MAX_WAGER,
  MAX_ACTIVE_BETS,
  MAX_COUNTER_ROUNDS,
  CHALLENGE_EXPIRY_MS,
  DURATION_MS,
} from "./lib/constants";

const tokenValidator = v.object({
  address: v.string(),
  symbol: v.string(),
  chain: v.string(),
  pairAddress: v.string(),
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
        ? { name: opponent.name, username: opponent.username }
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

export const feedForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asCreator = await ctx.db
      .query("bets")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.userId))
      .collect();

    const asOpponent = await ctx.db
      .query("bets")
      .withIndex("by_opponentId", (q) => q.eq("opponentId", args.userId))
      .collect();

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
      const user = await ctx.db.get(id as typeof args.userId);
      if (user) usersMap[id] = { name: user.name, username: user.username };
    }

    return allBets.map((bet) => ({
      ...bet,
      creator: usersMap[bet.creatorId] ?? null,
      opponent: bet.opponentId ? (usersMap[bet.opponentId] ?? null) : null,
    }));
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

    const activeBets = await ctx.db
      .query("bets")
      .withIndex("by_creatorId_status", (q) =>
        q.eq("creatorId", args.creatorId).eq("status", "active"),
      )
      .collect();
    const pendingBets = await ctx.db
      .query("bets")
      .withIndex("by_creatorId_status", (q) =>
        q.eq("creatorId", args.creatorId).eq("status", "pending"),
      )
      .collect();
    if (activeBets.length + pendingBets.length >= MAX_ACTIVE_BETS) {
      throw new Error(`Maximum ${MAX_ACTIVE_BETS} active bets allowed`);
    }

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

export const accept = mutation({
  args: {
    betId: v.id("bets"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    if (bet.status !== "pending" && bet.status !== "countered") {
      throw new Error("Bet is not available for acceptance");
    }
    if (bet.opponentId && bet.opponentId !== args.userId) {
      throw new Error("This challenge is not for you");
    }
    if (bet.creatorId === args.userId) {
      throw new Error("Cannot accept your own bet");
    }

    const now = Date.now();
    if (now > bet.expiresAt) throw new Error("Challenge has expired");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    if (user.points < bet.opponentWager) throw new Error("Insufficient points");

    await ctx.db.patch(args.userId, {
      points: user.points - bet.opponentWager,
    });

    await ctx.db.insert("pointTransactions", {
      userId: args.userId,
      amount: -bet.opponentWager,
      type: "bet_lock",
      betId: args.betId,
    });

    await ctx.db.patch(args.betId, {
      status: "active",
      opponentId: args.userId,
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

    if (bet.type !== "hit_price") {
      await ctx.scheduler.runAt(
        bet.resolvesAt,
        internal.resolution.resolveSnapshot,
        { betId: args.betId },
      );
    }

    return null;
  },
});

export const decline = mutation({
  args: {
    betId: v.id("bets"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    if (bet.status !== "pending" && bet.status !== "countered") {
      throw new Error("Bet cannot be declined");
    }
    if (bet.opponentId && bet.opponentId !== args.userId) {
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

export const counter = mutation({
  args: {
    betId: v.id("bets"),
    userId: v.id("users"),
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

    const isCreator = bet.creatorId === args.userId;
    const isOpponent = bet.opponentId === args.userId;
    if (!isCreator && !isOpponent) {
      throw new Error("You are not part of this bet");
    }

    const notifyUserId = isCreator ? bet.opponentId : bet.creatorId;

    if (isCreator) {
      const creator = await ctx.db.get(bet.creatorId);
      if (!creator) throw new Error("Creator not found");
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

export const cancel = mutation({
  args: {
    betId: v.id("bets"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) throw new Error("Bet not found");
    if (bet.creatorId !== args.userId) {
      throw new Error("Only the creator can cancel a bet");
    }
    if (bet.status !== "pending" && bet.status !== "countered") {
      throw new Error("Only pending bets can be cancelled");
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

    return null;
  },
});

export const rematch = mutation({
  args: {
    betId: v.id("bets"),
    userId: v.id("users"),
  },
  returns: v.id("bets"),
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.betId);
    if (!original) throw new Error("Bet not found");
    if (original.status !== "resolved" && original.status !== "tied") {
      throw new Error("Can only rematch resolved bets");
    }

    const isCreator = original.creatorId === args.userId;
    const isOpponent = original.opponentId === args.userId;
    if (!isCreator && !isOpponent) {
      throw new Error("You are not part of this bet");
    }

    const opponentId = isCreator
      ? original.opponentId
      : original.creatorId;
    const wager = original.creatorWager;

    const creator = await ctx.db.get(args.userId);
    if (!creator) throw new Error("User not found");
    if (creator.points < wager) throw new Error("Insufficient points");

    const activeBets = await ctx.db
      .query("bets")
      .withIndex("by_creatorId_status", (q) =>
        q.eq("creatorId", args.userId).eq("status", "active"),
      )
      .collect();
    const pendingBets = await ctx.db
      .query("bets")
      .withIndex("by_creatorId_status", (q) =>
        q.eq("creatorId", args.userId).eq("status", "pending"),
      )
      .collect();
    if (activeBets.length + pendingBets.length >= MAX_ACTIVE_BETS) {
      throw new Error(`Maximum ${MAX_ACTIVE_BETS} active bets allowed`);
    }

    const now = Date.now();
    const durationMs = DURATION_MS[original.duration];
    const resolvesAt = now + durationMs;
    const expiresAt = Math.min(now + CHALLENGE_EXPIRY_MS, resolvesAt);

    await ctx.db.patch(args.userId, {
      points: creator.points - wager,
    });
    await ctx.db.insert("pointTransactions", {
      userId: args.userId,
      amount: -wager,
      type: "bet_lock",
    });

    const betId = await ctx.db.insert("bets", {
      creatorId: args.userId,
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
