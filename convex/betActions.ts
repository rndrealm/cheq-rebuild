"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { fetchPrice } from "./lib/prices";

const tokenValidator = v.object({
  address: v.string(),
  symbol: v.string(),
  chain: v.string(),
  pairAddress: v.string(),
});

const betTypeValidator = v.union(
  v.literal("up_down"),
  v.literal("hit_price"),
  v.literal("token_vs_token"),
);

const durationValidator = v.union(
  v.literal("1h"),
  v.literal("4h"),
  v.literal("24h"),
  v.literal("3d"),
  v.literal("1w"),
);

export const createBet = action({
  args: {
    creatorId: v.id("users"),
    opponentId: v.optional(v.id("users")),
    type: betTypeValidator,
    token: tokenValidator,
    tokenB: v.optional(tokenValidator),
    betTerms: v.object({
      direction: v.optional(v.union(v.literal("up"), v.literal("down"))),
      targetPrice: v.optional(v.number()),
      creatorSide: v.optional(
        v.union(v.literal("tokenA"), v.literal("tokenB")),
      ),
    }),
    wager: v.number(),
    duration: durationValidator,
  },
  returns: v.id("bets"),
  handler: async (ctx, args) => {
    const priceResult = await fetchPrice(
      args.token.pairAddress,
      args.token.chain,
    );
    if (priceResult.price === null) {
      throw new Error("Could not fetch token price. Try again.");
    }

    let priceAtCreationB: number | undefined;
    if (args.type === "token_vs_token" && args.tokenB) {
      const priceBResult = await fetchPrice(
        args.tokenB.pairAddress,
        args.tokenB.chain,
      );
      if (priceBResult.price === null) {
        throw new Error("Could not fetch second token price. Try again.");
      }
      priceAtCreationB = priceBResult.price;
    }

    const betId: Id<"bets"> = await ctx.runMutation(internal.bets.create, {
      ...args,
      priceAtCreation: priceResult.price,
      priceAtCreationB,
    });
    return betId;
  },
});
