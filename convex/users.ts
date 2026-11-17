import { query, internalMutation, internalQuery } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import schema from "./schema";
import { getCurrentUser } from "./lib/auth";
import { authedMutation } from "./lib/functions";
import {
  REGISTRATION_BONUS,
  DEFAULT_MU,
  DEFAULT_SIGMA,
  DEFAULT_DISPLAY_RATING,
} from "./lib/constants";

export const me = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Sign-up's email step: whether an address is free to register, so a taken one
// is caught up front rather than after picking a username and password.
// Public and logged-out by nature. It reveals only whether an account exists
// for an address, which sign-up itself reveals anyway. Better Auth stores
// emails lowercased, so the lookup is too.
export const isEmailAvailable = query({
  args: { email: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { email }) => {
    const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user",
      where: [{ field: "email", value: email.trim().toLowerCase() }],
    });
    return user === null;
  },
});

// Used by `authedAction`, which has no `ctx.db`.
export const getByAuthIdInternal = internalQuery({
  args: { authId: v.string() },
  handler: async (ctx, args): Promise<Doc<"users"> | null> => {
    return await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();
  },
});

// A full users document, derived from the schema so it can't drift when
// fields are added (a hand-written copy here once missed the win-stat fields
// and made these queries throw ReturnsValidationError).
const userDocValidator = schema.tables.users.validator.extend({
  _id: v.id("users"),
  _creationTime: v.number(),
});

export const getByAuthId = query({
  args: { authId: v.string() },
  returns: v.union(userDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  returns: v.union(userDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

// Internal: sign-up creates the user row via the Better Auth `onCreate`
// trigger in auth.ts. A public version would let anyone mint bonus points.
export const create = internalMutation({
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

export const updateProfile = authedMutation({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates = args;
    const user = ctx.user;
    const userId = user._id;

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
