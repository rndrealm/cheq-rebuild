/**
 * Auth middleware. Use these builders for every public function that acts on
 * behalf of a user; they resolve the caller from the session and expose it as
 * `ctx.user`. Never accept a user id as an argument for authorization.
 *
 * Raw `query` / `mutation` / `action` from `_generated/server` are reserved for
 * intentionally public functions (enforced by ESLint for mutations/actions).
 */
import {
  customAction,
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import {
  action,
  mutation,
  query,
  type ActionCtx,
} from "../_generated/server";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import { getCurrentUser, requireUser } from "./auth";

export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => ({ user: await requireUser(ctx) })),
);

// For per-user reads that should return empty (not throw) when logged out,
// e.g. live queries still mounted while the user signs out. `ctx.user` is null
// without a session.
export const optionalAuthQuery = customQuery(
  query,
  customCtx(async (ctx) => ({ user: await getCurrentUser(ctx) })),
);

export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => ({ user: await requireUser(ctx) })),
);

export const authedAction = customAction(
  action,
  customCtx(async (ctx: ActionCtx): Promise<{ user: Doc<"users"> }> => {
    // Actions have no `ctx.db`; check the session here (before any external
    // calls) and load the user through an internal query.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user: Doc<"users"> | null = await ctx.runQuery(
      internal.users.getByAuthIdInternal,
      { authId: identity.subject },
    );
    if (!user) throw new Error("Not authenticated");
    return { user };
  }),
);
