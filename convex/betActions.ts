"use node";

import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { authedAction } from "./lib/functions";
import { fetchPrice } from "./lib/prices";
import { SUPPORTED_SYMBOLS } from "./lib/tokens";

const tokenValidator = v.object({
  symbol: v.string(),
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

export const createBet = authedAction({
  args: {
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
    for (const token of [args.token, args.tokenB]) {
      if (token && !SUPPORTED_SYMBOLS.has(token.symbol)) {
        throw new Error(`${token.symbol} is not supported`);
      }
    }

    console.log(`[createBet] Fetching price for ${args.token.symbol}`);
    const priceResult = await fetchPrice(args.token.symbol);
    if (priceResult.price === null) {
      throw new Error(
        `Could not fetch price for ${args.token.symbol}. Check Convex logs for details.`,
      );
    }
    console.log(
      `[createBet] ${args.token.symbol} price: ${priceResult.price}`,
    );

    let priceAtCreationB: number | undefined;
    if (args.type === "token_vs_token" && args.tokenB) {
      console.log(`[createBet] Fetching price for ${args.tokenB.symbol}`);
      const priceBResult = await fetchPrice(args.tokenB.symbol);
      if (priceBResult.price === null) {
        throw new Error(
          `Could not fetch price for ${args.tokenB.symbol}. Check Convex logs for details.`,
        );
      }
      priceAtCreationB = priceBResult.price;
      console.log(
        `[createBet] ${args.tokenB.symbol} price: ${priceAtCreationB}`,
      );
    }

    const betId: Id<"bets"> = await ctx.runMutation(internal.bets.create, {
      ...args,
      creatorId: ctx.user._id,
      priceAtCreation: priceResult.price,
      priceAtCreationB,
    });
    return betId;
  },
});

// The bet starts on acceptance: fetch the start price(s) here, then the
// internal mutation runs the checks, locks the wager and starts the clock.
export const acceptBet = authedAction({
  args: { betId: v.id("bets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet: Doc<"bets"> | null = await ctx.runQuery(
      internal.resolutionHelpers.getBet,
      { betId: args.betId },
    );
    if (!bet) throw new Error("Bet not found");

    const priceAtStart = await requirePrice(bet.token.symbol);
    const priceAtStartB =
      bet.type === "token_vs_token" && bet.tokenB
        ? await requirePrice(bet.tokenB.symbol)
        : undefined;

    await ctx.runMutation(internal.bets.accept, {
      betId: args.betId,
      userId: ctx.user._id,
      priceAtStart,
      priceAtStartB,
    });
    return null;
  },
});

async function requirePrice(symbol: string): Promise<number> {
  const result = await fetchPrice(symbol);
  if (result.price === null) {
    throw new Error(`Could not fetch price for ${symbol}. Try again.`);
  }
  return result.price;
}
