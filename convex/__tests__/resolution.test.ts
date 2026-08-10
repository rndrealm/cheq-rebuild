import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { internal } from "../_generated/api";
import { modules } from "../test.setup";
import { makeUser, TEST_TOKEN, TEST_TOKEN_B } from "./helpers";

describe("resolution", () => {
  test("settleSnapshot up_down: creator wins when price goes up", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice", points: 400 }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob", points: 400 }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "active",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.resolutionHelpers.settleSnapshot, {
      betId,
      priceAtResolution: 1.5,
      priceSource: "dexscreener",
    });

    const bet = await t.run(async (ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("resolved");
    expect(bet!.winnerId).toBe(aliceId);

    const alice = await t.run(async (ctx) => ctx.db.get(aliceId));
    expect(alice!.points).toBe(400 + 200);
  });

  test("settleSnapshot up_down: opponent wins when price goes down", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice", points: 400 }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob", points: 400 }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "active",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.resolutionHelpers.settleSnapshot, {
      betId,
      priceAtResolution: 0.5,
      priceSource: "dexscreener",
    });

    const bet = await t.run(async (ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("resolved");
    expect(bet!.winnerId).toBe(bobId);

    const bob = await t.run(async (ctx) => ctx.db.get(bobId));
    expect(bob!.points).toBe(400 + 200);
  });

  test("settleSnapshot up_down: tie when price unchanged", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice", points: 400 }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob", points: 400 }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "active",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.resolutionHelpers.settleSnapshot, {
      betId,
      priceAtResolution: 1.0,
      priceSource: "dexscreener",
    });

    const bet = await t.run(async (ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("tied");

    const alice = await t.run(async (ctx) => ctx.db.get(aliceId));
    const bob = await t.run(async (ctx) => ctx.db.get(bobId));
    expect(alice!.points).toBe(400 + 100);
    expect(bob!.points).toBe(400 + 100);
  });

  test("settleSnapshot token_vs_token: tokenA outperforms", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice", points: 400 }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob", points: 400 }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "token_vs_token",
        status: "active",
        token: TEST_TOKEN,
        tokenB: TEST_TOKEN_B,
        betTerms: { creatorSide: "tokenA" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        priceAtCreationB: 2.0,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    // Token A: 1.0→1.5 (+50%), Token B: 2.0→2.2 (+10%)
    await t.mutation(internal.resolutionHelpers.settleSnapshot, {
      betId,
      priceAtResolution: 1.5,
      priceAtResolutionB: 2.2,
      priceSource: "dexscreener",
    });

    const bet = await t.run(async (ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("resolved");
    expect(bet!.winnerId).toBe(aliceId);
  });

  test("settleTouch resolves when price hits target", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice", points: 400 }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob", points: 400 }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "hit_price",
        status: "active",
        token: TEST_TOKEN,
        betTerms: { targetPrice: 2.0 },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.resolutionHelpers.settleTouch, {
      betId,
      priceAtResolution: 2.5,
      priceSource: "dexscreener",
    });

    const bet = await t.run(async (ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("resolved");
    expect(bet!.winnerId).toBe(aliceId);

    const alice = await t.run(async (ctx) => ctx.db.get(aliceId));
    expect(alice!.points).toBe(400 + 200);
  });

  test("expireBet refunds creator on pending bet", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice", points: 400 }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        type: "up_down",
        status: "pending",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        duration: "1h",
        expiresAt: Date.now() - 1000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.resolutionHelpers.expireBet, { betId });

    const bet = await t.run(async (ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("expired");

    const alice = await t.run(async (ctx) => ctx.db.get(aliceId));
    expect(alice!.points).toBe(400 + 100);
  });

  test("expireBet skips active bets", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice", points: 400 }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob", points: 400 }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "active",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.resolutionHelpers.expireBet, { betId });

    const bet = await t.run(async (ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("active");
  });

  test("settleSnapshot creates rivalry on first bet", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice", points: 400 }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob", points: 400 }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "active",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.resolutionHelpers.settleSnapshot, {
      betId,
      priceAtResolution: 1.5,
      priceSource: "dexscreener",
    });

    const rivalry = await t.run(async (ctx) => {
      const [lower, higher] =
        aliceId < bobId ? [aliceId, bobId] : [bobId, aliceId];
      return ctx.db
        .query("rivalries")
        .withIndex("by_users", (q) =>
          q.eq("userAId", lower).eq("userBId", higher),
        )
        .first();
    });

    expect(rivalry).not.toBeNull();
    expect(rivalry!.totalBets).toBe(1);
  });

  test("settleSnapshot updates OpenSkill ratings", async () => {
    const t = convexTest({ schema, modules });

    const aliceId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "alice", username: "alice", points: 400 }),
      ),
    );
    const bobId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        makeUser({ authId: "bob", username: "bob", points: 400 }),
      ),
    );

    const betId = await t.run(async (ctx) =>
      ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "active",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 1.0,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      }),
    );

    await t.mutation(internal.resolutionHelpers.settleSnapshot, {
      betId,
      priceAtResolution: 1.5,
      priceSource: "dexscreener",
    });

    const alice = await t.run(async (ctx) => ctx.db.get(aliceId));
    const bob = await t.run(async (ctx) => ctx.db.get(bobId));

    expect(alice!.mu).toBeGreaterThan(bob!.mu);
    expect(alice!.displayRating).toBeGreaterThan(bob!.displayRating);
  });
});
