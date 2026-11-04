import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { api, internal } from "../_generated/api";
import { modules } from "../test.setup";
import { TEST_TOKEN } from "./helpers";
import type { Id } from "../_generated/dataModel";
import { REGISTRATION_BONUS, MIN_WAGER, MAX_ACTIVE_BETS } from "../lib/constants";

async function seedTwoUsers(t: ReturnType<typeof convexTest>) {
  const aliceId = await t.mutation(internal.users.create, {
    authId: "auth_alice",
    name: "Alice",
    username: "alice",
  });
  const bobId = await t.mutation(internal.users.create, {
    authId: "auth_bob",
    name: "Bob",
    username: "bob",
  });
  return {
    aliceId,
    bobId,
    asAlice: t.withIdentity({ subject: "auth_alice" }),
    asBob: t.withIdentity({ subject: "auth_bob" }),
  };
}


async function insertBets(
  t: ReturnType<typeof convexTest>,
  count: number,
  bet: {
    creatorId: Id<"users">;
    opponentId?: Id<"users">;
    status: "pending" | "countered" | "active";
  },
) {
  await t.run(async (ctx) => {
    for (let i = 0; i < count; i++) {
      await ctx.db.insert("bets", {
        ...bet,
        type: "up_down",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        creatorWager: 10,
        opponentWager: 10,
        priceAtCreation: 0.001,
        duration: "1h",
        expiresAt: Date.now() + 3600000,
        resolvesAt: Date.now() + 3600000,
        counterCount: 0,
        updatedAt: Date.now(),
      });
    }
  });
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

  test("create challenging yourself throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId } = await seedTwoUsers(t);

    await expect(
      t.mutation(internal.bets.create, {
        creatorId: aliceId,
        opponentId: aliceId,
        type: "up_down",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        wager: 100,
        priceAtCreation: 0.001,
        duration: "1h",
      }),
    ).rejects.toThrow("Cannot challenge yourself");
  });

  test("createBet action requires authentication", async () => {
    const t = convexTest({ schema, modules });
    await seedTwoUsers(t);

    await expect(
      t.action(api.betActions.createBet, {
        type: "up_down",
        token: TEST_TOKEN,
        betTerms: { direction: "up" },
        wager: 100,
        duration: "1h",
      }),
    ).rejects.toThrow("Not authenticated");
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

    const before = Date.now();
    await t.mutation(internal.bets.accept, {
      betId,
      userId: bobId,
      priceAtStart: 0.002,
    });

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("active");
    // The bet starts on acceptance: fresh start price and a full duration.
    expect(bet!.priceAtStart).toBe(0.002);
    expect(bet!.priceAtCreation).toBe(0.001);
    expect(bet!.startedAt).toBeGreaterThanOrEqual(before);
    expect(bet!.resolvesAt).toBe(bet!.startedAt! + 60 * 60 * 1000);

    const bob = await t.query(api.users.getById, { userId: bobId });
    expect(bob!.points).toBe(REGISTRATION_BONUS - 100);
  });

  test("accept requires authentication", async () => {
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
      t.action(api.betActions.acceptBet, { betId }),
    ).rejects.toThrow("Not authenticated");
  });

  test("accept by someone other than the named opponent throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);
    const carolId = await t.mutation(internal.users.create, {
      authId: "auth_carol",
      name: "Carol",
      username: "carol",
    });

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
      t.mutation(internal.bets.accept, {
        betId,
        userId: carolId,
        priceAtStart: 0.001,
      }),
    ).rejects.toThrow("This challenge is not for you");
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
      t.mutation(internal.bets.accept, {
        betId,
        userId: aliceId,
        priceAtStart: 0.001,
      }),
    ).rejects.toThrow("Cannot accept your own bet");
  });

  test("accept rejects an Over/under bet whose target is already reached", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);

    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "hit_price",
      token: TEST_TOKEN,
      betTerms: { targetPrice: 0.002, direction: "up" },
      wager: 100,
      priceAtCreation: 0.001,
      duration: "1h",
    });

    await expect(
      t.mutation(internal.bets.accept, {
        betId,
        userId: bobId,
        priceAtStart: 0.0025,
      }),
    ).rejects.toThrow("Target price already reached");

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("pending");
  });

  test("decline refunds creator and sets cancelled", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, asBob } = await seedTwoUsers(t);

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

    await asBob.mutation(api.bets.decline, { betId });

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("cancelled");

    const alice = await t.query(api.users.getById, { userId: aliceId });
    expect(alice!.points).toBe(REGISTRATION_BONUS);
  });

  test("decline of an open challenge throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, asBob } = await seedTwoUsers(t);

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
      asBob.mutation(api.bets.decline, { betId }),
    ).rejects.toThrow("This challenge is not for you");

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("pending");
  });

  test("counter updates wager and increments count", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, asBob } = await seedTwoUsers(t);

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

    await asBob.mutation(api.bets.counter, { betId, newWager: 150 });

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("countered");
    expect(bet!.creatorWager).toBe(150);
    expect(bet!.opponentWager).toBe(150);
    expect(bet!.counterCount).toBe(1);
  });

  test("counter by a non-participant throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);
    await t.mutation(internal.users.create, {
      authId: "auth_carol",
      name: "Carol",
      username: "carol",
    });

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
      t
        .withIdentity({ subject: "auth_carol" })
        .mutation(api.bets.counter, { betId, newWager: 150 }),
    ).rejects.toThrow("You are not part of this bet");
  });

  test("counter beyond max rounds throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, asAlice, asBob } = await seedTwoUsers(t);

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
      const caller = i % 2 === 0 ? asBob : asAlice;
      await caller.mutation(api.bets.counter, {
        betId,
        newWager: 100 + (i + 1) * 10,
      });
    }

    await expect(
      asAlice.mutation(api.bets.counter, { betId, newWager: 200 }),
    ).rejects.toThrow("Maximum counter rounds reached");
  });

  test("cancel refunds creator", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, asAlice } = await seedTwoUsers(t);

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

    await asAlice.mutation(api.bets.cancel, { betId });

    const bet = await t.query(api.bets.getById, { betId });
    expect(bet!.status).toBe("cancelled");

    const alice = await t.query(api.users.getById, { userId: aliceId });
    expect(alice!.points).toBe(REGISTRATION_BONUS);
  });

  test("cancel by non-creator throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, asBob } = await seedTwoUsers(t);

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
      asBob.mutation(api.bets.cancel, { betId }),
    ).rejects.toThrow("Only the creator can cancel");
  });

  test("rematch creates new bet from resolved bet", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, asAlice } = await seedTwoUsers(t);

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

    const newBetId = await asAlice.mutation(api.bets.rematch, {
      betId: originalBetId,
    });

    const newBet = await t.query(api.bets.getById, { betId: newBetId });
    expect(newBet!.status).toBe("pending");
    expect(newBet!.creatorId).toBe(aliceId);
    expect(newBet!.opponentId).toBe(bobId);
    expect(newBet!.type).toBe("up_down");
    expect(newBet!.creatorWager).toBe(100);
  });

  test("rematch by a non-participant throws", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId } = await seedTwoUsers(t);
    await t.mutation(internal.users.create, {
      authId: "auth_carol",
      name: "Carol",
      username: "carol",
    });

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

    await expect(
      t
        .withIdentity({ subject: "auth_carol" })
        .mutation(api.bets.rematch, { betId: originalBetId }),
    ).rejects.toThrow("You are not part of this bet");
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

  describe("active-bet limit", () => {
    const newBet = (creatorId: Id<"users">) => ({
      creatorId,
      type: "up_down" as const,
      token: TEST_TOKEN,
      betTerms: { direction: "up" as const },
      wager: MIN_WAGER,
      priceAtCreation: 0.001,
      duration: "1h" as const,
    });

    test("active bets as the opponent count toward the limit", async () => {
      const t = convexTest({ schema, modules });
      const { aliceId, bobId } = await seedTwoUsers(t);
      await insertBets(t, MAX_ACTIVE_BETS, {
        creatorId: bobId,
        opponentId: aliceId,
        status: "active",
      });

      await expect(
        t.mutation(internal.bets.create, newBet(aliceId)),
      ).rejects.toThrow(`Maximum ${MAX_ACTIVE_BETS} active bets allowed`);
    });

    test("countered bets count toward the limit", async () => {
      const t = convexTest({ schema, modules });
      const { aliceId, bobId } = await seedTwoUsers(t);
      await insertBets(t, MAX_ACTIVE_BETS, {
        creatorId: aliceId,
        opponentId: bobId,
        status: "countered",
      });

      await expect(
        t.mutation(internal.bets.create, newBet(aliceId)),
      ).rejects.toThrow(`Maximum ${MAX_ACTIVE_BETS} active bets allowed`);
    });

    test("incoming challenges not yet accepted don't count", async () => {
      const t = convexTest({ schema, modules });
      const { aliceId, bobId } = await seedTwoUsers(t);
      await insertBets(t, MAX_ACTIVE_BETS, {
        creatorId: bobId,
        opponentId: aliceId,
        status: "pending",
      });

      await expect(
        t.mutation(internal.bets.create, newBet(aliceId)),
      ).resolves.toBeDefined();
    });

    test("accept is blocked when the acceptor is at the limit", async () => {
      const t = convexTest({ schema, modules });
      const { aliceId, bobId } = await seedTwoUsers(t);
      await insertBets(t, MAX_ACTIVE_BETS, {
        creatorId: bobId,
        status: "pending",
      });
      const betId = await t.mutation(internal.bets.create, {
        ...newBet(aliceId),
        opponentId: bobId,
      });

      await expect(
        t.mutation(internal.bets.accept, {
          betId,
          userId: bobId,
          priceAtStart: 0.001,
        }),
      ).rejects.toThrow(`Maximum ${MAX_ACTIVE_BETS} active bets allowed`);
    });
  });

  describe("myActive", () => {
    async function insertBet(
      t: ReturnType<typeof convexTest>,
      bet: {
        creatorId: Id<"users">;
        opponentId?: Id<"users">;
        status: "pending" | "active" | "resolved";
        resolvesAt: number;
      },
    ) {
      return await t.run(async (ctx) =>
        ctx.db.insert("bets", {
          ...bet,
          type: "up_down",
          token: TEST_TOKEN,
          betTerms: { direction: "up" },
          creatorWager: 10,
          opponentWager: 20,
          priceAtCreation: 0.001,
          duration: "1h",
          expiresAt: bet.resolvesAt,
          counterCount: 0,
          updatedAt: 0,
        }),
      );
    }

    test("returns [] when logged out", async () => {
      const t = convexTest({ schema, modules });
      const { aliceId, bobId } = await seedTwoUsers(t);
      await insertBet(t, {
        creatorId: aliceId,
        opponentId: bobId,
        status: "active",
        resolvesAt: 1000,
      });

      expect(await t.query(api.bets.myActive, {})).toEqual([]);
    });

    test("returns active bets from both sides, soonest first, with the rival", async () => {
      const t = convexTest({ schema, modules });
      const { aliceId, bobId, asAlice } = await seedTwoUsers(t);

      const created = await insertBet(t, {
        creatorId: aliceId,
        opponentId: bobId,
        status: "active",
        resolvesAt: 2000,
      });
      const accepted = await insertBet(t, {
        creatorId: bobId,
        opponentId: aliceId,
        status: "active",
        resolvesAt: 1000,
      });
      // Not live: excluded.
      await insertBet(t, { creatorId: aliceId, status: "pending", resolvesAt: 500 });
      await insertBet(t, {
        creatorId: aliceId,
        opponentId: bobId,
        status: "resolved",
        resolvesAt: 500,
      });

      const bets = await asAlice.query(api.bets.myActive, {});
      expect(bets.map((b) => b._id)).toEqual([accepted, created]);
      expect(bets[0]).toMatchObject({
        isCreator: false,
        rival: { id: bobId, username: "bob" },
      });
      expect(bets[1]).toMatchObject({
        isCreator: true,
        rival: { id: bobId, username: "bob" },
      });
    });

    test("doesn't return other users' bets", async () => {
      const t = convexTest({ schema, modules });
      const { aliceId, bobId } = await seedTwoUsers(t);
      await t.mutation(internal.users.create, {
        authId: "auth_carol",
        name: "Carol",
        username: "carol",
      });
      await insertBet(t, {
        creatorId: aliceId,
        opponentId: bobId,
        status: "active",
        resolvesAt: 1000,
      });

      const asCarol = t.withIdentity({ subject: "auth_carol" });
      expect(await asCarol.query(api.bets.myActive, {})).toEqual([]);
    });
  });
});
