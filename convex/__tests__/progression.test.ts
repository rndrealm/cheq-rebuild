import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { internal } from "../_generated/api";
import { modules } from "../test.setup";
import { makeUser, TEST_TOKEN } from "./helpers";
import {
  XP_PER_BET,
  XP_WIN_BONUS,
  XP_BADGE_BONUS,
  WEEKLY_TOPUP,
  getLevelForXp,
} from "../lib/constants";

describe("progression", () => {
  test("awardBetXp gives winner and loser correct XP", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice" }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob" }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "resolved",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        winnerId: aliceId,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.progression.awardBetXp, {
      winnerId: aliceId,
      loserId: bobId,
      betId,
    });

    const alice = await t.run(async (ctx) => ctx.db.get(aliceId));
    const bob = await t.run(async (ctx) => ctx.db.get(bobId));

    expect(alice!.xp).toBe(XP_PER_BET + XP_WIN_BONUS);
    expect(bob!.xp).toBe(XP_PER_BET);
  });

  test("awardBetXp tracks win streak and totalWins", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({
          authId: "alice",
          username: "alice",
          currentWinStreak: 2,
          totalWins: 4,
          totalBetsResolved: 6,
        }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({
          authId: "bob",
          username: "bob",
          currentWinStreak: 1,
        }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "resolved",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        winnerId: aliceId,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.progression.awardBetXp, {
      winnerId: aliceId,
      loserId: bobId,
      betId,
    });

    const alice = await t.run(async (ctx) => ctx.db.get(aliceId));
    expect(alice!.currentWinStreak).toBe(3);
    expect(alice!.totalWins).toBe(5);
    expect(alice!.totalBetsResolved).toBe(7);

    const bob = await t.run(async (ctx) => ctx.db.get(bobId));
    expect(bob!.currentWinStreak).toBe(0);
  });

  test("awardTieXp gives both XP and resets win streaks", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({
          authId: "alice",
          username: "alice",
          currentWinStreak: 3,
        }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({
          authId: "bob",
          username: "bob",
          currentWinStreak: 1,
        }),
      ),
    );

    await t.mutation(internal.progression.awardTieXp, {
      userAId: aliceId,
      userBId: bobId,
    });

    const alice = await t.run(async (ctx) => ctx.db.get(aliceId));
    const bob = await t.run(async (ctx) => ctx.db.get(bobId));

    expect(alice!.xp).toBe(XP_PER_BET);
    expect(bob!.xp).toBe(XP_PER_BET);
    expect(alice!.currentWinStreak).toBe(0);
    expect(bob!.currentWinStreak).toBe(0);
  });

  test("first_blood badge awarded on first win", async () => {
    const t = convexTest({ schema, modules });

    await t.run(async (ctx) => {
      await ctx.db.insert("badges", {
        key: "first_blood",
        name: "First Blood",
        description: "Win your first bet",
        iconUrl: "/badges/first_blood.png",
        trigger: "first_win",
      });
    });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice" }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob" }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "resolved",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        winnerId: aliceId,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.progression.awardBetXp, {
      winnerId: aliceId,
      loserId: bobId,
      betId,
    });

    const badges = await t.run(async (ctx) =>
      ctx.db
        .query("userBadges")
        .withIndex("by_userId", (q) => q.eq("userId", aliceId))
        .collect(),
    );
    expect(badges).toHaveLength(1);

    const alice = await t.run(async (ctx) => ctx.db.get(aliceId));
    expect(alice!.xp).toBe(XP_PER_BET + XP_WIN_BONUS + XP_BADGE_BONUS);
  });

  test("weeklyTopup credits active users and skips inactive", async () => {
    const t = convexTest({ schema, modules });

    const now = Date.now();
    const activeId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({
          authId: "active",
          username: "active",
          lastActiveAt: now - 1000,
        }),
      ),
    );
    const inactiveId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({
          authId: "inactive",
          username: "inactive",
          lastActiveAt: now - 8 * 24 * 60 * 60 * 1000,
        }),
      ),
    );

    await t.mutation(internal.progression.weeklyTopup, {});

    const active = await t.run(async (ctx) => ctx.db.get(activeId));
    const inactive = await t.run(async (ctx) => ctx.db.get(inactiveId));

    expect(active!.points).toBe(500 + WEEKLY_TOPUP);
    expect(inactive!.points).toBe(500);

    const notifications = await t.run(async (ctx) =>
      ctx.db
        .query("notifications")
        .withIndex("by_userId", (q) => q.eq("userId", activeId))
        .collect(),
    );
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("weekly_topup");
  });

  test("getLevelForXp returns correct levels", () => {
    expect(getLevelForXp(0)).toBe(1);
    expect(getLevelForXp(49)).toBe(1);
    expect(getLevelForXp(50)).toBe(2);
    expect(getLevelForXp(149)).toBe(2);
    expect(getLevelForXp(150)).toBe(3);
    expect(getLevelForXp(17500)).toBe(20);
  });
});
