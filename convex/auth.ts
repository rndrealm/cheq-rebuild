import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins/username";
import { createClient, type AuthFunctions } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import authConfig from "./auth.config";
import type { DataModel } from "./_generated/dataModel";
import type { GenericCtx } from "@convex-dev/better-auth";
import {
  REGISTRATION_BONUS,
  DEFAULT_MU,
  DEFAULT_SIGMA,
  DEFAULT_DISPLAY_RATING,
} from "./lib/constants";

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, doc) => {
        const now = Date.now();
        const userId = await ctx.db.insert("users", {
          authId: doc._id,
          name: doc.name,
          username: doc.username ?? doc.name,
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
      },
    },
  },
});

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ["https://cheq.localhost"],
    plugins: [
      username(),
      convex({ authConfig }),
    ],
  });
};

export const { getAuthUser } = authComponent.clientApi();
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
