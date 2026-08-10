import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  REGISTRATION_BONUS,
  DEFAULT_MU,
  DEFAULT_SIGMA,
  DEFAULT_DISPLAY_RATING,
} from "./lib/constants";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
      .first();
  },
});

export const getByAuthId = query({
  args: { authId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      authId: v.string(),
      name: v.string(),
      username: v.string(),
      avatarUrl: v.optional(v.string()),
      points: v.number(),
      level: v.number(),
      xp: v.number(),
      mu: v.number(),
      sigma: v.number(),
      displayRating: v.number(),
      currentStreak: v.number(),
      longestStreak: v.number(),
      lastActiveAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      authId: v.string(),
      name: v.string(),
      username: v.string(),
      avatarUrl: v.optional(v.string()),
      points: v.number(),
      level: v.number(),
      xp: v.number(),
      mu: v.number(),
      sigma: v.number(),
      displayRating: v.number(),
      currentStreak: v.number(),
      longestStreak: v.number(),
      lastActiveAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const create = mutation({
  args: {
    authId: v.string(),
    name: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (existing) {
      throw new Error("Username already taken");
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      authId: args.authId,
      name: args.name,
      username: args.username,
      avatarUrl: args.avatarUrl,
      points: REGISTRATION_BONUS,
      level: 1,
      xp: 0,
      mu: DEFAULT_MU,
      sigma: DEFAULT_SIGMA,
      displayRating: DEFAULT_DISPLAY_RATING,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveAt: now,
    });

    await ctx.db.insert("pointTransactions", {
      userId,
      amount: REGISTRATION_BONUS,
      type: "registration_bonus",
    });

    return userId;
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length < 2) return [];
    return await ctx.db
      .query("users")
      .withSearchIndex("search_username", (q) =>
        q.search("username", args.query),
      )
      .take(10);
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (updates.username && updates.username !== user.username) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", updates.username!))
        .first();
      if (existing) {
        throw new Error("Username already taken");
      }
    }

    const patch: Record<string, string> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.username !== undefined) patch.username = updates.username;
    if (updates.avatarUrl !== undefined) patch.avatarUrl = updates.avatarUrl;

    await ctx.db.patch(userId, patch);
    return null;
  },
});
