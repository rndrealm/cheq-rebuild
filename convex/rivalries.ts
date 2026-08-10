import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByUsers = query({
  args: {
    userAId: v.id("users"),
    userBId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const [lower, higher] =
      args.userAId < args.userBId
        ? [args.userAId, args.userBId]
        : [args.userBId, args.userAId];

    return await ctx.db
      .query("rivalries")
      .withIndex("by_users", (q) =>
        q.eq("userAId", lower).eq("userBId", higher),
      )
      .first();
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asA = await ctx.db
      .query("rivalries")
      .withIndex("by_userAId", (q) => q.eq("userAId", args.userId))
      .collect();
    const asB = await ctx.db
      .query("rivalries")
      .withIndex("by_userBId", (q) => q.eq("userBId", args.userId))
      .collect();
    return [...asA, ...asB];
  },
});
