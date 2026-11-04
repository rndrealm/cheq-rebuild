import { internalQuery, internalMutation, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { updateRatings, updateRatingsTie } from "./lib/rating";
import { isTargetHit } from "./lib/touch";
import { applyBetXp } from "./progression";

export const getBet = internalQuery({
  args: { betId: v.id("bets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.betId);
  },
});

// Active hit_price bets still inside their window. Bets past `resolvesAt` are
// settled by `settleTouchDeadline`, so late hits are never polled.
export const getActiveTouchBets = internalQuery({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bets")
      .withIndex("by_status_resolvesAt", (q) =>
        q.eq("status", "active").gt("resolvesAt", args.now),
      )
      .filter((q) => q.eq(q.field("type"), "hit_price"))
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
    priceSource: v.literal("binance"),
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

// Creator wins: the target was hit inside the window. Re-checks the hit and
// the deadline here because the poller's price may be stale by the time this
// runs; if the deadline won the race, `settleTouchDeadline` handles it.
export const settleTouch = internalMutation({
  args: {
    betId: v.id("bets"),
    priceAtResolution: v.number(),
    priceSource: v.literal("binance"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet || bet.status !== "active") return null;
    if (!bet.opponentId) return null;
    if (bet.type !== "hit_price") return null;
    if (Date.now() > bet.resolvesAt) return null;
    if (!isTargetHit(bet.betTerms, args.priceAtResolution)) return null;

    await settleTouchBet(ctx, bet, bet.creatorId, bet.opponentId, {
      resolvedVia: "touch",
      priceAtResolution: args.priceAtResolution,
      priceSource: args.priceSource,
    });
    return null;
  },
});

// Opponent wins: scheduled at `resolvesAt` when a hit_price bet is accepted.
// No price fetch needed, so it can't fail on the price API.
export const settleTouchDeadline = internalMutation({
  args: { betId: v.id("bets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.db.get(args.betId);
    if (!bet || bet.status !== "active") return null;
    if (!bet.opponentId) return null;
    if (bet.type !== "hit_price") return null;
    if (Date.now() < bet.resolvesAt) return null;

    await settleTouchBet(ctx, bet, bet.opponentId, bet.creatorId, {
      resolvedVia: "deadline",
    });
    return null;
  },
});

// One-off migration for hit_price bets accepted before deadlines were
// scheduled: refunds bets already past their deadline (we can't verify the
// poller was healthy during their window) and schedules the deadline for the
// rest. Safe to re-run. `npx convex run resolutionHelpers:backfillTouchDeadlines`
export const backfillTouchDeadlines = internalMutation({
  args: {},
  returns: v.object({ refunded: v.number(), scheduled: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const bets = await ctx.db
      .query("bets")
      .withIndex("by_status_resolvesAt", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("type"), "hit_price"))
      .collect();

    let refunded = 0;
    let scheduled = 0;
    for (const bet of bets) {
      if (bet.resolvesAt > now) {
        await ctx.scheduler.runAt(
          bet.resolvesAt,
          internal.resolutionHelpers.settleTouchDeadline,
          { betId: bet._id },
        );
        scheduled++;
        continue;
      }

      const players: [Id<"users"> | undefined, number][] = [
        [bet.creatorId, bet.creatorWager],
        [bet.opponentId, bet.opponentWager],
      ];
      for (const [userId, wager] of players) {
        if (!userId) continue;
        const user = await ctx.db.get(userId);
        if (!user) continue;
        await ctx.db.patch(userId, { points: user.points + wager });
        await ctx.db.insert("pointTransactions", {
          userId,
          amount: wager,
          type: "bet_unlock",
          betId: bet._id,
        });
      }
      await ctx.db.patch(bet._id, { status: "cancelled", updatedAt: now });
      refunded++;
    }

    return { refunded, scheduled };
  },
});

async function settleTouchBet(
  ctx: MutationCtx,
  bet: Doc<"bets">,
  winnerId: Id<"users">,
  loserId: Id<"users">,
  resolution: {
    resolvedVia: "touch" | "deadline";
    priceAtResolution?: number;
    priceSource?: "binance";
  },
) {
  const now = Date.now();
  const hit = resolution.resolvedVia === "touch";

  await ctx.db.patch(bet._id, {
    status: "resolved",
    priceAtResolution: resolution.priceAtResolution,
    priceSource: resolution.priceSource,
    resolvedVia: resolution.resolvedVia,
    resolvedAt: now,
    winnerId,
    updatedAt: now,
  });

  const winner = await ctx.db.get(winnerId);
  const loser = await ctx.db.get(loserId);
  if (!winner || !loser) return;

  const totalPot = bet.creatorWager + bet.opponentWager;
  await ctx.db.patch(winnerId, {
    points: winner.points + totalPot,
  });
  await ctx.db.insert("pointTransactions", {
    userId: winnerId,
    amount: totalPot,
    type: "bet_win",
    betId: bet._id,
  });
  await ctx.db.insert("pointTransactions", {
    userId: loserId,
    amount: 0,
    type: "bet_loss",
    betId: bet._id,
  });

  const rated = updateRatings(
    { mu: winner.mu, sigma: winner.sigma },
    { mu: loser.mu, sigma: loser.sigma },
  );
  await ctx.db.patch(winnerId, rated.winner);
  await ctx.db.patch(loserId, rated.loser);

  await updateRivalry(ctx, winnerId, loserId, winnerId);

  await applyBetXp(ctx, winnerId, loserId, bet._id);

  const body = hit
    ? `${bet.token.symbol} hit the target price`
    : `${bet.token.symbol} didn't hit the target price in time`;
  await ctx.db.insert("notifications", {
    userId: winnerId,
    type: "bet_resolved",
    title: "You Won!",
    body,
    betId: bet._id,
    read: false,
  });
  await ctx.db.insert("notifications", {
    userId: loserId,
    type: "bet_resolved",
    title: "You Lost",
    body,
    betId: bet._id,
    read: false,
  });
}

function determineSnapshotWinner(
  bet: {
    type: string;
    creatorId: Id<"users">;
    opponentId?: Id<"users">;
    priceAtCreation: number;
    priceAtCreationB?: number;
    priceAtStart?: number;
    priceAtStartB?: number;
    betTerms: {
      direction?: string;
      creatorSide?: string;
    };
  },
  priceAtResolution: number,
  priceAtResolutionB?: number,
): Id<"users"> | null {
  if (!bet.opponentId) return null;

  // Bets start on acceptance; older bets have no start price.
  const startA = bet.priceAtStart ?? bet.priceAtCreation;
  const startB = bet.priceAtStartB ?? bet.priceAtCreationB;

  if (bet.type === "up_down") {
    const wentUp = priceAtResolution > startA;
    const wentDown = priceAtResolution < startA;
    if (!wentUp && !wentDown) return null;
    const creatorPicked = bet.betTerms.direction;
    if (creatorPicked === "up") {
      return wentUp ? bet.creatorId : bet.opponentId;
    }
    return wentDown ? bet.creatorId : bet.opponentId;
  }

  if (bet.type === "token_vs_token") {
    if (priceAtResolutionB === undefined || startB === undefined) {
      return null;
    }
    const changeA = (priceAtResolution - startA) / startA;
    const changeB = (priceAtResolutionB - startB) / startB;
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
