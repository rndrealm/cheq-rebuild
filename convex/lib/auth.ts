import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

// `users.authId` stores the Better Auth user id, which is `identity.subject`.
// Single auth provider, so `subject` is unique (the Convex guidelines prefer
// `tokenIdentifier` when multiple issuers are involved).
export async function getCurrentUser(
  ctx: Pick<QueryCtx, "auth" | "db">,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", identity.subject))
    .first();
}

export async function requireUser(
  ctx: Pick<QueryCtx, "auth" | "db">,
): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}
