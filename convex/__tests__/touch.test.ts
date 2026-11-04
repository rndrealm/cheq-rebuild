import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import schema from "../schema";
import { internal } from "../_generated/api";
import { modules } from "../test.setup";
import { makeUser, TEST_TOKEN } from "./helpers";
import { XP_PER_BET, XP_WIN_BONUS } from "../lib/constants";
import type { Id } from "../_generated/dataModel";

const HOUR = 60 * 60 * 1000;

async function seed(
  t: ReturnType<typeof convexTest>,
  bet: {
    direction?: "up" | "down";
    targetPrice?: number;
    resolvesAt?: number;
    status?: "active" | "pending";
  } = {},
) {
  const aliceId = await t.run((ctx) =>
    ctx.db.insert(
      "users",
      makeUser({ authId: "alice", username: "alice", points: 400 }),
    ),
  );
  const bobId = await t.run((ctx) =>
    ctx.db.insert("users", makeUser({ authId: "bob", username: "bob", points: 400 })),
  );
  const betId = await t.run((ctx) =>
    ctx.db.insert("bets", {
      creatorId: aliceId,
      opponentId: bobId,
      type: "hit_price",
      status: bet.status ?? "active",
      token: TEST_TOKEN,
      betTerms: {
        targetPrice: bet.targetPrice ?? 2.0,
        ...(bet.direction ? { direction: bet.direction } : {}),
      },
      creatorWager: 100,
      opponentWager: 100,
      priceAtCreation: 1.0,
      duration: "1h",
      expiresAt: Date.now() + HOUR,
      resolvesAt: bet.resolvesAt ?? Date.now() + HOUR,
      counterCount: 0,
      updatedAt: Date.now(),
    }),
  );
  return { aliceId, bobId, betId };
}

function getAll(
  t: ReturnType<typeof convexTest>,
  [betId, aliceId, bobId]: [Id<"bets">, Id<"users">, Id<"users">],
) {
  return t.run((ctx) =>
    Promise.all([ctx.db.get(betId), ctx.db.get(aliceId), ctx.db.get(bobId)]),
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("hit_price settlement", () => {
  test("settleTouch: target hit pays the creator and awards XP once", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, betId } = await seed(t);

    await t.mutation(internal.resolutionHelpers.settleTouch, {
      betId,
      priceAtResolution: 2.5,
      priceSource: "binance",
    });

    const [bet, alice, bob] = await getAll(t, [betId, aliceId, bobId]);
    expect(bet).toMatchObject({
      status: "resolved",
      winnerId: aliceId,
      resolvedVia: "touch",
    });
    expect(alice).toMatchObject({
      points: 600,
      xp: XP_PER_BET + XP_WIN_BONUS,
    });
    expect(bob).toMatchObject({ points: 400, xp: XP_PER_BET });
  });

  test("settleTouch: price that doesn't hit is ignored", async () => {
    const t = convexTest({ schema, modules });
    const { betId } = await seed(t);

    await t.mutation(internal.resolutionHelpers.settleTouch, {
      betId,
      priceAtResolution: 1.9,
      priceSource: "binance",
    });

    const bet = await t.run((ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("active");
  });

  test("settleTouch: 'Under' hits at or below the target", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, betId } = await seed(t, { direction: "down" });

    await t.mutation(internal.resolutionHelpers.settleTouch, {
      betId,
      priceAtResolution: 2.5,
      priceSource: "binance",
    });
    expect((await t.run((ctx) => ctx.db.get(betId)))!.status).toBe("active");

    await t.mutation(internal.resolutionHelpers.settleTouch, {
      betId,
      priceAtResolution: 1.5,
      priceSource: "binance",
    });
    const bet = await t.run((ctx) => ctx.db.get(betId));
    expect(bet).toMatchObject({ status: "resolved", winnerId: aliceId });
  });

  test("settleTouch: a hit after the deadline doesn't count", async () => {
    const t = convexTest({ schema, modules });
    const { betId } = await seed(t, { resolvesAt: Date.now() - 1000 });

    await t.mutation(internal.resolutionHelpers.settleTouch, {
      betId,
      priceAtResolution: 2.5,
      priceSource: "binance",
    });

    const bet = await t.run((ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("active");
  });

  test("settleTouchDeadline: untouched bet pays the opponent", async () => {
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, betId } = await seed(t, {
      resolvesAt: Date.now() - 1000,
    });

    await t.mutation(internal.resolutionHelpers.settleTouchDeadline, { betId });

    const [bet, alice, bob] = await getAll(t, [betId, aliceId, bobId]);
    expect(bet).toMatchObject({
      status: "resolved",
      winnerId: bobId,
      resolvedVia: "deadline",
    });
    expect(bob).toMatchObject({
      points: 600,
      xp: XP_PER_BET + XP_WIN_BONUS,
    });
    expect(alice).toMatchObject({ points: 400, xp: XP_PER_BET });
  });

  test("settleTouchDeadline: does nothing before the deadline", async () => {
    const t = convexTest({ schema, modules });
    const { betId } = await seed(t);

    await t.mutation(internal.resolutionHelpers.settleTouchDeadline, { betId });

    const bet = await t.run((ctx) => ctx.db.get(betId));
    expect(bet!.status).toBe("active");
  });

  test("touch then deadline settles once (no double payout or XP)", async () => {
    vi.useFakeTimers();
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, betId } = await seed(t);

    await t.mutation(internal.resolutionHelpers.settleTouch, {
      betId,
      priceAtResolution: 2.5,
      priceSource: "binance",
    });
    vi.advanceTimersByTime(2 * HOUR);
    await t.mutation(internal.resolutionHelpers.settleTouchDeadline, { betId });

    const [bet, alice, bob] = await getAll(t, [betId, aliceId, bobId]);
    expect(bet).toMatchObject({ winnerId: aliceId, resolvedVia: "touch" });
    expect(alice).toMatchObject({ points: 600, xp: XP_PER_BET + XP_WIN_BONUS });
    expect(bob).toMatchObject({ points: 400, xp: XP_PER_BET });
  });

  test("accept schedules the deadline: opponent wins when it passes", async () => {
    vi.useFakeTimers();
    const t = convexTest({ schema, modules });
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
    const betId = await t.mutation(internal.bets.create, {
      creatorId: aliceId,
      opponentId: bobId,
      type: "hit_price",
      token: TEST_TOKEN,
      betTerms: { targetPrice: 2.0, direction: "up" },
      wager: 100,
      priceAtCreation: 1.0,
      duration: "1h",
    });

    await t.mutation(internal.bets.accept, {
      betId,
      userId: bobId,
      priceAtStart: 1.0,
    });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const bet = await t.run((ctx) => ctx.db.get(betId));
    expect(bet).toMatchObject({
      status: "resolved",
      winnerId: bobId,
      resolvedVia: "deadline",
    });
  });

  test("getActiveTouchBets skips bets past their deadline", async () => {
    const t = convexTest({ schema, modules });
    const { betId } = await seed(t);
    await t.run(async (ctx) => {
      const { _id, _creationTime, ...rest } = (await ctx.db.get(betId))!;
      void _id;
      void _creationTime;
      await ctx.db.insert("bets", { ...rest, resolvesAt: Date.now() - 1000 });
    });

    const active = await t.query(internal.resolutionHelpers.getActiveTouchBets, {
      now: Date.now(),
    });
    expect(active.map((b) => b._id)).toEqual([betId]);
  });

  test("backfillTouchDeadlines refunds overdue bets and schedules the rest", async () => {
    vi.useFakeTimers();
    const t = convexTest({ schema, modules });
    const { aliceId, bobId, betId: overdueId } = await seed(t, {
      resolvesAt: Date.now() - 1000,
    });
    // Wagers were locked when the bet was made.
    await t.run(async (ctx) => {
      await ctx.db.patch(aliceId, { points: 300 });
      await ctx.db.patch(bobId, { points: 300 });
    });
    const futureId = await t.run(async (ctx) => {
      const overdue = (await ctx.db.get(overdueId))!;
      const { _id, _creationTime, ...rest } = overdue;
      void _id;
      void _creationTime;
      return ctx.db.insert("bets", { ...rest, resolvesAt: Date.now() + HOUR });
    });

    const result = await t.mutation(
      internal.resolutionHelpers.backfillTouchDeadlines,
      {},
    );
    expect(result).toEqual({ refunded: 1, scheduled: 1 });

    const [overdue, alice, bob] = await getAll(t, [overdueId, aliceId, bobId]);
    expect(overdue!.status).toBe("cancelled");
    expect(alice!.points).toBe(400);
    expect(bob!.points).toBe(400);

    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const future = await t.run((ctx) => ctx.db.get(futureId));
    expect(future).toMatchObject({ status: "resolved", winnerId: bobId });
  });
});
