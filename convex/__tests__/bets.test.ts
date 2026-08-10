import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { api, internal } from "../_generated/api";
import { modules } from "../test.setup";
import { TEST_TOKEN } from "./helpers";
import { REGISTRATION_BONUS, MIN_WAGER } from "../lib/constants";

async function seedTwoUsers(t: ReturnType<typeof convexTest>) {
  const aliceId = await t.mutation(api.users.create, {
    authId: "auth_alice",
    name: "Alice",
    username: "alice",
  });
  const bobId = await t.mutation(api.users.create, {
    authId: "auth_bob",
    name: "Bob",
    username: "bob",
  });
  return { aliceId, bobId };
}

describe("bets", () => {
  test("create deducts points and sets pending", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("pending");
    expect(bet!.creatorWager).toBe(100);
    expect(bet!.opponentWager).toBe(100);

    const alice = await t.query(api.users.getById, { userId: aliceId });
    expect(alice!.points).toBe(REGISTRATION_BONUS - 100);
  });

  test("create sends notification to opponent", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    const notifications = await t.run(async (ctx) => {
      return ctx.db
        .query("notifications")
        .withIndex("by_userId", (q) => q.eq("userId", bobId))
        .collect();
    });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("challenge_received");
  });

  test("create with insufficient points throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 500,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    await expect(
      t.mutation(internal.bets.create, {
        creatorId: aliceId,
        type: "up_down",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        wager: MIN_WAGER,
        priceAtCreation: 0.001,
        duration: "1h",
      }),
    ).rejects.toThrow("Insufficient points");
  });

  test("create with wager below minimum throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId } = await seedTwoUsers(t);

    await expect(
      t.mutation(internal.bets.create, {
        creatorId: aliceId,
        type: "up_down",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        wager: MIN_WAGER - 1,
        priceAtCreation: 0.001,
        duration: "1h",
      }),
    ).rejects.toThrow("Wager must be between");
  });

  test("accept deducts opponent points and activates bet", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    await t.mutation(api.bets.accept, { betId, userId: bobId });

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("active");

    const bob = await t.query(api.users.getById, { userId: bobId });
    expect(bob!.points).toBe(REGISTRATION_BONUS - 100);
  });

  test("accept own bet throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId } = await seedTwoUsers(t);

    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    await expect(
      t.mutation(api.bets.accept, { betId, userId: aliceId }),
    ).rejects.toThrow("Cannot accept your own bet");
  });

  test("decline refunds creator and sets cancelled", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    await t.mutation(api.bets.decline, { betId, userId: bobId });

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("cancelled");

    const alice = await t.query(api.users.getById, { userId: aliceId });
    expect(alice!.points).toBe(REGISTRATION_BONUS);
  });

  test("counter updates wager and increments count", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    await t.mutation(api.bets.counter, {
      betId,
      userId: bobId,
      newWager: 150,
    });

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("countered");
    expect(bet!.creatorWager).toBe(150);
    expect(bet!.opponentWager).toBe(150);
    expect(bet!.counterCount).toBe(1);
  });

  test("counter beyond max rounds throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    for (let i = 0; i < 3; i++) {
      const userId = i % 2 === 0 ? bobId : aliceId;
      await t.mutation(api.bets.counter, {
        betId,
        userId,
        newWager: 100 + (i + 1) * 10,
      });
    }

    await expect(
      t.mutation(api.bets.counter, {
        betId,
        userId: aliceId,
        newWager: 200,
      }),
    ).rejects.toThrow("Maximum counter rounds reached");
  });

  test("cancel refunds creator", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    await t.mutation(api.bets.cancel, { betId, userId: aliceId });

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("cancelled");

    const alice = await t.query(api.users.getById, { userId: aliceId });
    expect(alice!.points).toBe(REGISTRATION_BONUS);
  });

  test("cancel by non-creator throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    await expect(
      t.mutation(api.bets.cancel, { betId, userId: bobId }),
    ).rejects.toThrow("Only the creator can cancel");
  });

  test("rematch creates new bet from resolved bet", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    const originalBetId = await t.run(async (ctx) => {
      return ctx.db.insert("bets", {
        creatorId: aliceId,
        opponentId: bobId,
        type: "up_down",
        status: "resolved",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 100,
        opponentWager: 100,
        priceAtCreation: 0.001,
        duration: "1h",
        expiresAt: Date.now() + 86400000,
        resolvesAt: Date.now() + 3600000,
        winnerId: aliceId,
        counterCount: 0,
        updatedAt: Date.now(),
      });
    });

    const newBetId = await t.mutation(api.bets.rematch, {
      betId: originalBetId,
      userId: aliceId,
    });

    const newBet = await t.query(api.bets.getById, { betId: newBetId });
    expect(newBet!.status).toBe("pending");
    expect(newBet!.creatorId).toBe(aliceId);
    expect(newBet!.opponentId).toBe(bobId);
    expect(newBet!.type).toBe("up_down");
    expect(newBet!.creatorWager).toBe(100);
  });

  test("listByUser returns bets as creator and opponent", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "up" },
      wager: 50,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    await t.mutation(internal.bets.create, {
      creatorId: bobId,
      opponentId: aliceId,
      type: "up_down",
      token: TEST_TOKEN,
      betTerms: { direction: "down" },
      wager: 50,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    const aliceBets = await t.query(api.bets.listByUser, {
      userId: aliceId,
    });
    expect(aliceBets).toHaveLength(2);
  });
});
