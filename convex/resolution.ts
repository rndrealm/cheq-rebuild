"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { fetchPriceWithRetry, fetchPrice } from "./lib/prices";
import { isTargetHit } from "./lib/touch";

export const resolveSnapshot = internalAction({
  args: { betId: v.id("bets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bet = await ctx.runQuery(internal.resolutionHelpers.getBet, {
      betId: args.betId,
    });
    if (!bet || bet.status !== "active") return null;

    const result = await fetchPriceWithRetry(bet.token.symbol);

    if (result.price === null) {
      await ctx.runMutation(internal.resolutionHelpers.flagBet, {
        betId: args.betId,
      });
      return null;
    }

    let priceAtResolutionB: number | undefined;
    if (bet.type === "token_vs_token" && bet.tokenB) {
      const resultB = await fetchPriceWithRetry(bet.tokenB.symbol);
      if (resultB.price === null) {
        await ctx.runMutation(internal.resolutionHelpers.flagBet, {
          betId: args.betId,
        });
        return null;
      }
      priceAtResolutionB = resultB.price;
    }

    await ctx.runMutation(internal.resolutionHelpers.settleSnapshot, {
      betId: args.betId,
      priceAtResolution: result.price,
      priceAtResolutionB,
      priceSource: result.source,
    });

    const settled = await ctx.runQuery(internal.resolutionHelpers.getBet, {
      betId: args.betId,
    });
    if (settled && settled.opponentId) {
      if (settled.status === "tied") {
        await ctx.runMutation(internal.progression.awardTieXp, {
          userAId: settled.creatorId,
          userBId: settled.opponentId,
        });
      } else if (settled.status === "resolved" && settled.winnerId) {
        const loserId =
          settled.winnerId === settled.creatorId
            ? settled.opponentId
            : settled.creatorId;
        await ctx.runMutation(internal.progression.awardBetXp, {
          winnerId: settled.winnerId,
          loserId,
          betId: args.betId,
        });
      }
    }

    return null;
  },
});

export const pollTouchBets = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const activeTouchBets = await ctx.runQuery(
      internal.resolutionHelpers.getActiveTouchBets,
      { now: Date.now() },
    );

    for (const bet of activeTouchBets) {
      const result = await fetchPrice(bet.token.symbol);
      if (result.price === null) continue;
      if (!isTargetHit(bet.betTerms, result.price)) continue;

      // settleTouch re-checks status, deadline and hit, and awards XP in the
      // same transaction, so overlapping runs can't double-settle.
      await ctx.runMutation(internal.resolutionHelpers.settleTouch, {
        betId: bet._id,
        priceAtResolution: result.price,
        priceSource: result.source,
      });
    }

    return null;
  },
});

export const expireStaleChallenge = internalAction({
  args: { betId: v.id("bets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.resolutionHelpers.expireBet, {
      betId: args.betId,
    });
    return null;
  },
});
