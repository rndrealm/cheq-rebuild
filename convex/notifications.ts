import { v } from "convex/values";
import { authedMutation, optionalAuthQuery } from "./lib/functions";

// The caller's own notifications. Empty when logged out.
export const list = optionalAuthQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];
    const userId = ctx.user._id;
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const unread = optionalAuthQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];
    const userId = ctx.user._id;
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", userId).eq("read", false),
      )
      .order("desc")
      .take(50);
  },
});

export const unreadCount = optionalAuthQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    if (!ctx.user) return 0;
    const userId = ctx.user._id;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", userId).eq("read", false),
      )
      .take(100);
    return unread.length;
  },
});

export const markRead = authedMutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== ctx.user._id) {
      throw new Error("Notification not found");
    }
    await ctx.db.patch(args.notificationId, { read: true });
    return null;
  },
});

export const markAllRead = authedMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) =>
        q.eq("userId", ctx.user._id).eq("read", false),
      )
      .take(100);

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { read: true });
    }
    return null;
  },
});
