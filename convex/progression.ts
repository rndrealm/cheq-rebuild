import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  XP_PER_BET,
  XP_WIN_BONUS,
  XP_BADGE_BONUS,
  WEEKLY_TOPUP,
  STREAK_BONUS_BASE,
  STREAK_BONUS_MULTIPLIER,
  getLevelForXp,
} from "./lib/constants";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const awardBetXp = internalMutation({
  args: {
    winnerId: v.id("users"),
    loserId: v.id("users"),
    betId: v.id("bets"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const winner = await ctx.db.get(args.winnerId);
    const loser = await ctx.db.get(args.loserId);
    if (!winner || !loser) return null;

    const winnerXp = winner.xp + XP_PER_BET + XP_WIN_BONUS;
    const loserXp = loser.xp + XP_PER_BET;

    await ctx.db.patch(args.winnerId, {
      xp: winnerXp,
      level: getLevelForXp(winnerXp),
      totalWins: (winner.totalWins ?? 0) + 1,
      totalBetsResolved: (winner.totalBetsResolved ?? 0) + 1,
      currentWinStreak: (winner.currentWinStreak ?? 0) + 1,
    });

    await ctx.db.patch(args.loserId, {
      xp: loserXp,
      level: getLevelForXp(loserXp),
      totalBetsResolved: (loser.totalBetsResolved ?? 0) + 1,
      currentWinStreak: 0,
    });

    await checkBadges(ctx, args.winnerId, args.betId);
    await checkBadges(ctx, args.loserId, args.betId);

    return null;
  },
});

export const awardTieXp = internalMutation({
  args: {
    userAId: v.id("users"),
    userBId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userA = await ctx.db.get(args.userAId);
    const userB = await ctx.db.get(args.userBId);
    if (!userA || !userB) return null;

    const xpA = userA.xp + XP_PER_BET;
    const xpB = userB.xp + XP_PER_BET;

    await ctx.db.patch(args.userAId, {
      xp: xpA,
      level: getLevelForXp(xpA),
      totalBetsResolved: (userA.totalBetsResolved ?? 0) + 1,
      currentWinStreak: 0,
    });

    await ctx.db.patch(args.userBId, {
      xp: xpB,
      level: getLevelForXp(xpB),
      totalBetsResolved: (userB.totalBetsResolved ?? 0) + 1,
      currentWinStreak: 0,
    });

    return null;
  },
});

export const weeklyTopup = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      if (user.lastActiveAt < oneWeekAgo) continue;

      await ctx.db.patch(user._id, {
        points: user.points + WEEKLY_TOPUP,
      });
      await ctx.db.insert("pointTransactions", {
        userId: user._id,
        amount: WEEKLY_TOPUP,
        type: "weekly_topup",
      });
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "weekly_topup",
        title: "Weekly Top-Up!",
        body: `You received ${WEEKLY_TOPUP} points`,
        read: false,
      });
    }

    return null;
  },
});

export const checkStreaks = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      if (user.lastActiveAt >= oneDayAgo) {
        const newStreak = user.currentStreak + 1;
        const bonus = Math.floor(
          STREAK_BONUS_BASE * Math.pow(STREAK_BONUS_MULTIPLIER, Math.min(newStreak - 1, 10)),
        );

        await ctx.db.patch(user._id, {
          currentStreak: newStreak,
          longestStreak: Math.max(user.longestStreak, newStreak),
          points: user.points + bonus,
        });
        await ctx.db.insert("pointTransactions", {
          userId: user._id,
          amount: bonus,
          type: "streak_bonus",
        });
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: "streak_bonus",
          title: `${newStreak}-Day Streak!`,
          body: `You earned ${bonus} bonus points`,
          read: false,
        });
      } else if (user.lastActiveAt < twoDaysAgo && user.currentStreak > 0) {
        await ctx.db.patch(user._id, { currentStreak: 0 });
      }
    }

    return null;
  },
});

async function checkBadges(
  ctx: MutationCtx,
  userId: Id<"users">,
  betId: Id<"bets">,
) {
  const user = await ctx.db.get(userId);
  if (!user) return;

  const bet = await ctx.db.get(betId);
  if (!bet) return;

  const checks: { key: string; condition: () => Promise<boolean> }[] = [
    {
      key: "first_blood",
      condition: async () => (user.totalWins ?? 0) === 1,
    },
    {
      key: "on_a_roll",
      condition: async () => (user.currentWinStreak ?? 0) >= 3,
    },
    {
      key: "hot_streak",
      condition: async () => (user.currentWinStreak ?? 0) >= 5,
    },
    {
      key: "rivalry_started",
      condition: async () => {
        if (!bet.opponentId) return false;
        const [lower, higher] =
          userId < bet.opponentId
            ? [userId, bet.opponentId]
            : [bet.opponentId, userId];
        const rivalry = await ctx.db
          .query("rivalries")
          .withIndex("by_users", (q) =>
            q.eq("userAId", lower).eq("userBId", higher),
          )
          .first();
        return rivalry?.totalBets === 1;
      },
    },
    {
      key: "nemesis",
      condition: async () => {
        if (!bet.opponentId) return false;
        const [lower, higher] =
          userId < bet.opponentId
            ? [userId, bet.opponentId]
            : [bet.opponentId, userId];
        const rivalry = await ctx.db
          .query("rivalries")
          .withIndex("by_users", (q) =>
            q.eq("userAId", lower).eq("userBId", higher),
          )
          .first();
        return (rivalry?.totalBets ?? 0) >= 10;
      },
    },
    {
      key: "underdog",
      condition: async () => {
        if (bet.winnerId !== userId) return false;
        const isCreator = bet.creatorId === userId;
        const myWager = isCreator ? bet.creatorWager : bet.opponentWager;
        const theirWager = isCreator ? bet.opponentWager : bet.creatorWager;
        return myWager < theirWager;
      },
    },
    {
      key: "dedicated",
      condition: async () => user.currentStreak >= 7,
    },
  ];

  for (const check of checks) {
    const badge = await ctx.db
      .query("badges")
      .withIndex("by_key", (q) => q.eq("key", check.key))
      .first();

    if (!badge) continue;

    const alreadyHas = await ctx.db
      .query("userBadges")
      .withIndex("by_userId_badgeId", (q) =>
        q.eq("userId", userId).eq("badgeId", badge._id),
      )
      .first();

    if (alreadyHas) continue;

    if (await check.condition()) {
      await ctx.db.insert("userBadges", {
        userId,
        badgeId: badge._id,
        earnedAt: Date.now(),
      });

      const newXp = user.xp + XP_BADGE_BONUS;
      await ctx.db.patch(userId, {
        xp: newXp,
        level: getLevelForXp(newXp),
      });

      await ctx.db.insert("notifications", {
        userId,
        type: "badge_earned",
        title: "Badge Earned!",
        body: `You earned the "${badge.name}" badge`,
        read: false,
      });
    }
  }
}
