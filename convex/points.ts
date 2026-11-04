import { optionalAuthQuery } from "./lib/functions";

// The caller's own point history. Empty when logged out.
export const list = optionalAuthQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];
    const userId = ctx.user._id;
    return await ctx.db
      .query("pointTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});
