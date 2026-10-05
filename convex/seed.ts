import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_MU,
  DEFAULT_SIGMA,
  DEFAULT_DISPLAY_RATING,
  DURATION_MS,
  CHALLENGE_EXPIRY_MS,
} from "./lib/constants";

const FAKE_USERS = [
  { name: "CryptoKing", username: "cryptoking" },
  { name: "MoonShot", username: "moonshot" },
  { name: "DexHunter", username: "dexhunter" },
] as const;

const TOKENS = {
  SOL: {
    address: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    chain: "solana",
    pairAddress: "8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj",
  },
  ETH: {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    symbol: "ETH",
    chain: "ethereum",
    pairAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
  },
  PEPE: {
    address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    symbol: "PEPE",
    chain: "ethereum",
    pairAddress: "0xa43fe16908251ee70ef74718545e4fe6c5ccec9f",
  },
  DOGE: {
    address: "0x4206931337dc273a630d328dA6441786BfaD668f",
    symbol: "DOGE",
    chain: "ethereum",
    pairAddress: "0x9a315bdf513367c0377fb36886cfc33b46320058",
  },
  WIF: {
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    symbol: "WIF",
    chain: "solana",
    pairAddress: "EP2ib6dYdEeqD8MfE2ezHCxX3kP3K2eLKkirfPm5eyMx",
  },
} as const;

export const seedBets = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bets")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.userId))
      .first();
    if (existing) return;

    const now = Date.now();
    const userDefaults = {
      points: 500,
      level: 3,
      xp: 200,
      mu: DEFAULT_MU,
      sigma: DEFAULT_SIGMA,
      displayRating: DEFAULT_DISPLAY_RATING,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveAt: now,
    };

    const opponentIds = [];
    for (const fake of FAKE_USERS) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", fake.username))
        .first();
      if (existingUser) {
        opponentIds.push(existingUser._id);
      } else {
        const id = await ctx.db.insert("users", {
          authId: `seed_${fake.username}`,
          name: fake.name,
          username: fake.username,
          ...userDefaults,
        });
        opponentIds.push(id);
      }
    }

    // 1. Pending: you challenged CryptoKing — SOL goes up
    await ctx.db.insert("bets", {
      creatorId: args.userId,
      opponentId: opponentIds[0],
      type: "up_down",
      status: "pending",
      token: TOKENS.SOL,
      betTerms: { direction: "up" },
      creatorWager: 100,
      opponentWager: 100,
      priceAtCreation: 118.5,
      duration: "24h",
      expiresAt: now + CHALLENGE_EXPIRY_MS,
      resolvesAt: now + DURATION_MS["24h"],
      counterCount: 0,
      updatedAt: now,
    });

    // 2. Active: MoonShot accepted your ETH goes down bet
    await ctx.db.insert("bets", {
      creatorId: args.userId,
      opponentId: opponentIds[1],
      type: "up_down",
      status: "active",
      token: TOKENS.ETH,
      betTerms: { direction: "down" },
      creatorWager: 200,
      opponentWager: 200,
      priceAtCreation: 2650.0,
      duration: "4h",
      expiresAt: now - 1000,
      resolvesAt: now + DURATION_MS["4h"],
      counterCount: 0,
      updatedAt: now - 60_000,
    });

    // 3. Resolved (you won): beat DexHunter on PEPE hit_price
    await ctx.db.insert("bets", {
      creatorId: args.userId,
      opponentId: opponentIds[2],
      type: "hit_price",
      status: "resolved",
      token: TOKENS.PEPE,
      betTerms: { targetPrice: 0.0000052 },
      creatorWager: 150,
      opponentWager: 150,
      priceAtCreation: 0.0000044,
      priceAtResolution: 0.0000053,
      winnerId: args.userId,
      duration: "1w",
      expiresAt: now - DURATION_MS["1w"],
      resolvesAt: now - 86400_000,
      resolvedAt: now - 86400_000,
      resolvedVia: "touch",
      priceSource: "dexscreener",
      counterCount: 0,
      updatedAt: now - 86400_000,
    });

    // 4. Countered: CryptoKing countered your DOGE bet
    await ctx.db.insert("bets", {
      creatorId: args.userId,
      opponentId: opponentIds[0],
      type: "up_down",
      status: "countered",
      token: TOKENS.DOGE,
      betTerms: { direction: "up" },
      creatorWager: 75,
      opponentWager: 75,
      priceAtCreation: 0.094,
      duration: "3d",
      expiresAt: now + CHALLENGE_EXPIRY_MS,
      resolvesAt: now + DURATION_MS["3d"],
      counterCount: 1,
      updatedAt: now - 3600_000,
    });

    // 5. Pending (received): MoonShot challenged you — WIF vs SOL
    await ctx.db.insert("bets", {
      creatorId: opponentIds[1],
      opponentId: args.userId,
      type: "token_vs_token",
      status: "pending",
      token: TOKENS.WIF,
      tokenB: TOKENS.SOL,
      betTerms: { creatorSide: "tokenA" },
      creatorWager: 50,
      opponentWager: 50,
      priceAtCreation: 0.235,
      priceAtCreationB: 118.5,
      duration: "1h",
      expiresAt: now + CHALLENGE_EXPIRY_MS,
      resolvesAt: now + DURATION_MS["1h"],
      counterCount: 0,
      updatedAt: now - 1800_000,
    });
  },
});
