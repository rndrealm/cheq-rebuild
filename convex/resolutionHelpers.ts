import { internalQuery, internalMutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { updateRatings, updateRatingsTie } from "./lib/rating";

export const getBet = internalQuery({
  args: { betId: v.id("bets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.betId);
  },
});

export const getActiveTouchBets = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bets")
      .withIndex("by_creatorId_status")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("type"), "hit_price"),
        ),
      )
      .collect();
  },
});

export const flagBet = internalMutation({
  args: { betId: v.id("bets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.betId, {
      status: "flagged",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const expireBet = internalMutation({
  args: { betId: v.id("bets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet) return null;
    if (bet.status !== "pending" && bet.status !== "countered") return null;

    const creator = await ctx.db.get(bet.creatorId);
    if (creator) {
      await ctx.db.patch(bet.creatorId, {
        points: creator.points + bet.creatorWager,
      });
      await ctx.db.insert("pointTransactions", {
        userId: bet.creatorId,
        amount: bet.creatorWager,
        type: "bet_unlock",
        betId: args.betId,
      });
    }

    await ctx.db.patch(args.betId, {
      status: "expired",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const settleSnapshot = internalMutation({
  args: {
    betId: v.id("bets"),
    priceAtResolution: v.number(),
    priceAtResolutionB: v.optional(v.number()),
    priceSource: v.union(v.literal("dexscreener"), v.literal("geckoterminal")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet || bet.status !== "active") return null;
    if (!bet.opponentId) return null;

    const winnerId = determineSnapshotWinner(bet, args.priceAtResolution, args.priceAtResolutionB);
    const isTie = winnerId === null;
    const now = Date.now();

    await ctx.db.patch(args.betId, {
      status: isTie ? "tied" : "resolved",
      priceAtResolution: args.priceAtResolution,
      priceAtResolutionB: args.priceAtResolutionB,
      priceSource: args.priceSource,
      resolvedVia: "snapshot",
      resolvedAt: now,
      winnerId: winnerId ?? undefined,
      updatedAt: now,
    });

    const creator = await ctx.db.get(bet.creatorId);
    const opponent = await ctx.db.get(bet.opponentId);
    if (!creator || !opponent) return null;

    if (isTie) {
      await ctx.db.patch(bet.creatorId, {
        points: creator.points + bet.creatorWager,
      });
      await ctx.db.patch(bet.opponentId, {
        points: opponent.points + bet.opponentWager,
      });
      await ctx.db.insert("pointTransactions", {
        userId: bet.creatorId,
        amount: bet.creatorWager,
        type: "bet_unlock",
        betId: args.betId,
      });
      await ctx.db.insert("pointTransactions", {
        userId: bet.opponentId,
        amount: bet.opponentWager,
        type: "bet_unlock",
        betId: args.betId,
      });

      const tied = updateRatingsTie(
        { mu: creator.mu, sigma: creator.sigma },
        { mu: opponent.mu, sigma: opponent.sigma },
      );
      await ctx.db.patch(bet.creatorId, tied.playerA);
      await ctx.db.patch(bet.opponentId, tied.playerB);
    } else {
      const loserId = winnerId === bet.creatorId ? bet.opponentId : bet.creatorId;
      const totalPot = bet.creatorWager + bet.opponentWager;
      const winner = winnerId === bet.creatorId ? creator : opponent;

      await ctx.db.patch(winnerId, {
        points: winner.points + totalPot,
      });
      await ctx.db.insert("pointTransactions", {
        userId: winnerId,
        amount: totalPot,
        type: "bet_win",
        betId: args.betId,
      });
      await ctx.db.insert("pointTransactions", {
        userId: loserId,
        amount: 0,
        type: "bet_loss",
        betId: args.betId,
      });

      const winnerData = winnerId === bet.creatorId ? creator : opponent;
      const loserData = winnerId === bet.creatorId ? opponent : creator;
      const rated = updateRatings(
        { mu: winnerData.mu, sigma: winnerData.sigma },
        { mu: loserData.mu, sigma: loserData.sigma },
      );
      await ctx.db.patch(winnerId, rated.winner);
      await ctx.db.patch(loserId, rated.loser);
    }

    await updateRivalry(ctx, bet.creatorId, bet.opponentId, winnerId);

    await ctx.db.insert("notifications", {
      userId: bet.creatorId,
      type: "bet_resolved",
      title: isTie ? "It's a Tie!" : winnerId === bet.creatorId ? "You Won!" : "You Lost",
      body: `${bet.token.symbol} bet resolved`,
      betId: args.betId,
      read: false,
    });
    await ctx.db.insert("notifications", {
      userId: bet.opponentId,
      type: "bet_resolved",
      title: isTie ? "It's a Tie!" : winnerId === bet.opponentId ? "You Won!" : "You Lost",
      body: `${bet.token.symbol} bet resolved`,
      betId: args.betId,
      read: false,
    });

    return null;
  },
});

export const settleTouch = internalMutation({
  args: {
    betId: v.id("bets"),
    priceAtResolution: v.number(),
    priceSource: v.union(v.literal("dexscreener"), v.literal("geckoterminal")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet || bet.status !== "active") return null;
    if (!bet.opponentId) return null;
    if (bet.type !== "hit_price") return null;

    const winnerId = bet.creatorId;
    const loserId = bet.opponentId;
    const now = Date.now();

    await ctx.db.patch(args.betId, {
      status: "resolved",
      priceAtResolution: args.priceAtResolution,
      priceSource: args.priceSource,
      resolvedVia: "touch",
      resolvedAt: now,
      winnerId,
      updatedAt: now,
    });

    const winner = await ctx.db.get(winnerId);
    const loser = await ctx.db.get(loserId);
    if (!winner || !loser) return null;

    const totalPot = bet.creatorWager + bet.opponentWager;
    await ctx.db.patch(winnerId, {
      points: winner.points + totalPot,
    });
    await ctx.db.insert("pointTransactions", {
      userId: winnerId,
      amount: totalPot,
      type: "bet_win",
      betId: args.betId,
    });
    await ctx.db.insert("pointTransactions", {
      userId: loserId,
      amount: 0,
      type: "bet_loss",
      betId: args.betId,
    });

    const rated = updateRatings(
      { mu: winner.mu, sigma: winner.sigma },
      { mu: loser.mu, sigma: loser.sigma },
    );
    await ctx.db.patch(winnerId, rated.winner);
    await ctx.db.patch(loserId, rated.loser);

    await updateRivalry(ctx, bet.creatorId, bet.opponentId, winnerId);

    await ctx.db.insert("notifications", {
      userId: winnerId,
      type: "bet_resolved",
      title: "You Won!",
      body: `${bet.token.symbol} hit the target price!`,
      betId: args.betId,
      read: false,
    });
    await ctx.db.insert("notifications", {
      userId: loserId,
      type: "bet_resolved",
      title: "You Lost",
      body: `${bet.token.symbol} hit the target price`,
      betId: args.betId,
      read: false,
    });

    return null;
  },
});

function determineSnapshotWinner(
  bet: {
    type: string;
    creatorId: Id<"users">;
    opponentId?: Id<"users">;
    priceAtCreation: number;
    priceAtCreationB?: number;
    betTerms: {
      direction?: string;
      creatorSide?: string;
    };
  },
  priceAtResolution: number,
  priceAtResolutionB?: number,
): Id<"users"> | null {
  if (!bet.opponentId) return null;

  if (bet.type === "up_down") {
    const wentUp = priceAtResolution > bet.priceAtCreation;
    const wentDown = priceAtResolution < bet.priceAtCreation;
    if (!wentUp && !wentDown) return null;
    const creatorPicked = bet.betTerms.direction;
    if (creatorPicked === "up") {
      return wentUp ? bet.creatorId : bet.opponentId;
    }
    return wentDown ? bet.creatorId : bet.opponentId;
  }

  if (bet.type === "token_vs_token") {
    if (priceAtResolutionB === undefined || bet.priceAtCreationB === undefined) {
      return null;
    }
    const changeA =
      (priceAtResolution - bet.priceAtCreation) / bet.priceAtCreation;
    const changeB =
      (priceAtResolutionB - bet.priceAtCreationB) / bet.priceAtCreationB;
    if (changeA === changeB) return null;
    const tokenAWon = changeA > changeB;
    if (bet.betTerms.creatorSide === "tokenA") {
      return tokenAWon ? bet.creatorId : bet.opponentId;
    }
    return tokenAWon ? bet.opponentId : bet.creatorId;
  }

  return null;
}

async function updateRivalry(
  ctx: MutationCtx,
  userAId: Id<"users">,
  userBId: Id<"users">,
  winnerId: Id<"users"> | null,
) {
  const [lower, higher] =
    userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  const existing = await ctx.db
    .query("rivalries")
    .withIndex("by_users", (q: any) =>
      q.eq("userAId", lower).eq("userBId", higher),
    )
    .first();

  const now = Date.now();

  if (existing) {
    const patch: Record<string, any> = {
      totalBets: existing.totalBets + 1,
      lastBetAt: now,
    };

    if (winnerId === null) {
      patch.currentStreakHolder = undefined;
      patch.currentStreakCount = 0;
    } else if (winnerId === lower) {
      patch.userAWins = existing.userAWins + 1;
      patch.currentStreakHolder = lower;
      patch.currentStreakCount =
        existing.currentStreakHolder === lower
          ? existing.currentStreakCount + 1
          : 1;
    } else {
      patch.userBWins = existing.userBWins + 1;
      patch.currentStreakHolder = higher;
      patch.currentStreakCount =
        existing.currentStreakHolder === higher
          ? existing.currentStreakCount + 1
          : 1;
    }

    await ctx.db.patch(existing._id, patch);
  } else {
    await ctx.db.insert("rivalries", {
      userAId: lower,
      userBId: higher,
      userAWins: winnerId === lower ? 1 : 0,
      userBWins: winnerId === higher ? 1 : 0,
      totalBets: 1,
      currentStreakHolder: winnerId ?? undefined,
      currentStreakCount: winnerId ? 1 : 0,
      lastBetAt: now,
    });
  }
}
