import { query } from "./_generated/server";

export const topRated = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_displayRating")
      .order("desc")
      .take(50);
  },
});

export const sharpest = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_points")
      .order("desc")
      .take(200);

    return users
      .filter((u) => (u.totalBetsResolved ?? 0) >= 10)
      .map((u) => ({
        ...u,
        winRate: (u.totalWins ?? 0) / (u.totalBetsResolved ?? 1),
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 50);
  },
});

export const onFire = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_currentStreak")
      .order("desc")
      .take(50);
  },
});
