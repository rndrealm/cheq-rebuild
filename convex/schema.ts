import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { chartPointValidator } from "./lib/chart";

export default defineSchema({
  users: defineTable({
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
    currentWinStreak: v.optional(v.number()),
    totalWins: v.optional(v.number()),
    totalBetsResolved: v.optional(v.number()),
    lastActiveAt: v.number(),
  })
    .index("by_authId", ["authId"])
    .index("by_username", ["username"])
    .index("by_displayRating", ["displayRating"])
    .index("by_points", ["points"])
    .index("by_currentStreak", ["currentStreak"])
    .searchIndex("search_username", { searchField: "username" }),

  bets: defineTable({
    creatorId: v.id("users"),
    opponentId: v.optional(v.id("users")),
    type: v.union(
      v.literal("up_down"),
      v.literal("hit_price"),
      v.literal("token_vs_token"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("countered"),
      v.literal("active"),
      v.literal("resolved"),
      v.literal("tied"),
      v.literal("expired"),
      v.literal("cancelled"),
      v.literal("flagged"),
    ),
    token: v.object({
      symbol: v.string(),
    }),
    tokenB: v.optional(
      v.object({
        symbol: v.string(),
      }),
    ),
    betTerms: v.object({
      direction: v.optional(v.union(v.literal("up"), v.literal("down"))),
      targetPrice: v.optional(v.number()),
      creatorSide: v.optional(
        v.union(v.literal("tokenA"), v.literal("tokenB")),
      ),
    }),
    creatorWager: v.number(),
    opponentWager: v.number(),
    // Price when the challenge was created (a preview only once the bet starts).
    priceAtCreation: v.number(),
    priceAtCreationB: v.optional(v.number()),
    // The bet starts when it's accepted: these are the baseline for settlement.
    // Missing on bets accepted before this was added; fall back to priceAtCreation.
    priceAtStart: v.optional(v.number()),
    priceAtStartB: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    priceAtResolution: v.optional(v.number()),
    priceAtResolutionB: v.optional(v.number()),
    winnerId: v.optional(v.id("users")),
    duration: v.union(
      v.literal("1h"),
      v.literal("4h"),
      v.literal("24h"),
      v.literal("3d"),
      v.literal("1w"),
    ),
    expiresAt: v.number(),
    resolvesAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedVia: v.optional(
      v.union(
        v.literal("snapshot"),
        v.literal("touch"),
        // hit_price bet reached its deadline without hitting the target
        v.literal("deadline"),
        v.literal("manual"),
      ),
    ),
    priceSource: v.optional(v.literal("binance")),
    counterCount: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creatorId", ["creatorId"])
    .index("by_opponentId", ["opponentId"])
    .index("by_creatorId_status", ["creatorId", "status"])
    .index("by_opponentId_status", ["opponentId", "status"])
    .index("by_status_resolvesAt", ["status", "resolvesAt"]),

  // Checkpoints in a live bet ("75% of the way to the target", "lead change",
  // "halfway"), detected by the checkpoint poller. Neutral facts: the UI words
  // them from each viewer's side. `key` is unique per bet, so a checkpoint
  // can only be recorded once.
  betEvents: defineTable({
    betId: v.id("bets"),
    key: v.string(),
    kind: v.union(
      v.literal("progress"),
      v.literal("near_target"),
      v.literal("lead_change"),
      v.literal("halfway"),
      v.literal("final_stretch"),
    ),
    at: v.number(),
    price: v.number(),
    priceB: v.optional(v.number()),
    // progress: the threshold crossed (50, 75, 90).
    progress: v.optional(v.number()),
    // lead_change: who just took the lead.
    leader: v.optional(v.union(v.literal("creator"), v.literal("opponent"))),
  })
    .index("by_betId_and_key", ["betId", "key"])
    .index("by_at", ["at"]),

  // Latest price and 24h stats per supported token, from Binance. One row per
  // token, overwritten by the checkpoint poller every 30s (see market.ts).
  marketPrices: defineTable({
    symbol: v.string(),
    price: v.number(),
    priceChange24h: v.number(),
    priceChangeAbs24h: v.number(),
    open24h: v.number(),
    high24h: v.number(),
    low24h: v.number(),
    volume: v.number(),
    updatedAt: v.number(),
  }).index("by_symbol", ["symbol"]),

  rivalries: defineTable({
    userAId: v.id("users"),
    userBId: v.id("users"),
    userAWins: v.number(),
    userBWins: v.number(),
    totalBets: v.number(),
    currentStreakHolder: v.optional(v.id("users")),
    currentStreakCount: v.number(),
    lastBetAt: v.number(),
  })
    .index("by_userAId", ["userAId"])
    .index("by_userBId", ["userBId"])
    .index("by_users", ["userAId", "userBId"]),

  badges: defineTable({
    key: v.string(),
    name: v.string(),
    description: v.string(),
    iconUrl: v.string(),
    trigger: v.string(),
  }).index("by_key", ["key"]),

  userBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.id("badges"),
    earnedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_badgeId", ["userId", "badgeId"]),

  pointTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(
      v.literal("registration_bonus"),
      v.literal("weekly_topup"),
      v.literal("streak_bonus"),
      v.literal("bet_lock"),
      v.literal("bet_unlock"),
      v.literal("bet_win"),
      v.literal("bet_loss"),
    ),
    betId: v.optional(v.id("bets")),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_type", ["userId", "type"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("challenge_received"),
      v.literal("challenge_accepted"),
      v.literal("challenge_declined"),
      v.literal("counter_received"),
      v.literal("bet_resolved"),
      v.literal("badge_earned"),
      v.literal("streak_bonus"),
      v.literal("weekly_topup"),
    ),
    title: v.string(),
    body: v.string(),
    betId: v.optional(v.id("bets")),
    read: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_read", ["userId", "read"]),

  // Cached token chart per range ("1D", "1W", …): real Binance candles,
  // downsampled to at most CHART_POINTS. Refetched once older than the
  // range's TTL (see chartSeries.ts).
  chartSeries: defineTable({
    symbol: v.string(),
    interval: v.string(),
    points: v.array(chartPointValidator),
    fetchedAt: v.number(),
  }).index("by_symbol_and_interval", ["symbol", "interval"]),
});
