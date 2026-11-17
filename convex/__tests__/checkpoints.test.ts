import { convexTest, type TestConvex } from "convex-test";
import { describe, expect, test, vi, afterEach } from "vitest";
import schema from "../schema";
import { api, internal } from "../_generated/api";
import { modules } from "../test.setup";
import type { Doc, Id } from "../_generated/dataModel";
import {
  detectCheckpoints,
  MAX_LEAD_CHANGES,
  type FiredEvent,
} from "../lib/checkpoints";

const HOUR = 3_600_000;
const START = 1_000_000_000;

type Bet = Parameters<typeof detectCheckpoints>[0]["bet"];

function bet(overrides: Partial<Doc<"bets">> = {}): Bet {
  return {
    type: "up_down",
    betTerms: { direction: "up" },
    duration: "1h",
    startedAt: START,
    resolvesAt: START + HOUR,
    priceAtStart: 100,
    priceAtCreation: 100,
    ...overrides,
  } as Bet;
}

const hitBet = (target = 200) =>
  bet({ type: "hit_price", betTerms: { direction: "up", targetPrice: target } });

function keys(found: { key: string }[]) {
  return found.map((f) => f.key);
}

describe("detectCheckpoints: time", () => {
  test("nothing before halfway", () => {
    expect(
      detectCheckpoints({ bet: bet(), priceA: 100, now: START + HOUR * 0.4, fired: [] }),
    ).toEqual([]);
  });

  test("halfway, then final stretch, each once", () => {
    const half = detectCheckpoints({ bet: bet(), priceA: 100, now: START + HOUR * 0.5, fired: [] });
    expect(keys(half)).toEqual(["halfway"]);

    const fired: FiredEvent[] = [{ key: "halfway", kind: "halfway", at: START + HOUR * 0.5 }];
    expect(
      detectCheckpoints({ bet: bet(), priceA: 100, now: START + HOUR * 0.6, fired }),
    ).toEqual([]);

    const final = detectCheckpoints({ bet: bet(), priceA: 100, now: START + HOUR * 0.95, fired });
    expect(keys(final)).toEqual(["final_stretch"]);
  });

  test("nothing outside the bet window", () => {
    expect(detectCheckpoints({ bet: bet(), priceA: 150, now: START - 1, fired: [] })).toEqual([]);
    expect(detectCheckpoints({ bet: bet(), priceA: 150, now: START + HOUR, fired: [] })).toEqual([]);
  });
});

describe("detectCheckpoints: hit_price progress", () => {
  const early = START + HOUR * 0.1;

  test("crossing 50% records progress_50", () => {
    const found = detectCheckpoints({ bet: hitBet(), priceA: 150, now: early, fired: [] });
    expect(found).toEqual([{ key: "progress_50", kind: "progress", progress: 50 }]);
  });

  test("a jump past several thresholds records only the highest", () => {
    const found = detectCheckpoints({ bet: hitBet(), priceA: 180, now: early, fired: [] });
    expect(keys(found)).toEqual(["progress_75"]);
  });

  test("lower thresholds aren't recorded after a higher one", () => {
    const fired: FiredEvent[] = [
      { key: "progress_75", kind: "progress", progress: 75, at: early },
    ];
    expect(
      detectCheckpoints({ bet: hitBet(), priceA: 160, now: early + 1, fired }),
    ).toEqual([]);
  });

  test("near target within 1%", () => {
    const found = detectCheckpoints({ bet: hitBet(), priceA: 198.5, now: early, fired: [] });
    expect(keys(found)).toEqual(["progress_90", "near_target"]);
  });

  test("moving away from the target records nothing", () => {
    expect(
      detectCheckpoints({ bet: hitBet(), priceA: 80, now: early, fired: [] }),
    ).toEqual([]);
  });

  test("Under targets count progress downward", () => {
    const under = bet({
      type: "hit_price",
      betTerms: { direction: "down", targetPrice: 50 },
    });
    const found = detectCheckpoints({ bet: under, priceA: 75, now: early, fired: [] });
    expect(keys(found)).toEqual(["progress_50"]);
  });

  test("a hit records nothing (the bet settles instead)", () => {
    expect(
      detectCheckpoints({ bet: hitBet(), priceA: 200, now: early, fired: [] }),
    ).toEqual([]);
  });
});

describe("detectCheckpoints: lead changes", () => {
  const t0 = START + HOUR * 0.1;

  test("inside the buffer nobody leads", () => {
    // 1h buffer is 0.05%: 100.04 is +0.04%.
    expect(
      detectCheckpoints({ bet: bet(), priceA: 100.04, now: t0, fired: [] }),
    ).toEqual([]);
  });

  test("first clear lead is recorded", () => {
    const found = detectCheckpoints({ bet: bet(), priceA: 100.1, now: t0, fired: [] });
    expect(found).toEqual([{ key: "lead_1", kind: "lead_change", leader: "creator" }]);
  });

  test("same leader again records nothing", () => {
    const fired: FiredEvent[] = [
      { key: "lead_1", kind: "lead_change", leader: "creator", at: t0 },
    ];
    expect(
      detectCheckpoints({ bet: bet(), priceA: 100.5, now: t0 + HOUR * 0.1, fired }),
    ).toEqual([]);
  });

  test("a flip right after a lead change is held back (min gap)", () => {
    const fired: FiredEvent[] = [
      { key: "lead_1", kind: "lead_change", leader: "creator", at: t0 },
    ];
    // Min gap for 1h is max(60s, 2% of 1h = 72s).
    expect(
      detectCheckpoints({ bet: bet(), priceA: 99.8, now: t0 + 30_000, fired }),
    ).toEqual([]);
    const later = detectCheckpoints({ bet: bet(), priceA: 99.8, now: t0 + 80_000, fired });
    expect(later).toEqual([{ key: "lead_2", kind: "lead_change", leader: "opponent" }]);
  });

  test("lead changes stop at the cap", () => {
    const fired: FiredEvent[] = Array.from({ length: MAX_LEAD_CHANGES }, (_, i) => ({
      key: `lead_${i + 1}`,
      kind: "lead_change" as const,
      leader: i % 2 === 0 ? ("creator" as const) : ("opponent" as const),
      at: t0 + i,
    }));
    // Last recorded leader is "opponent" (index 11); creator retakes it.
    expect(
      detectCheckpoints({ bet: bet(), priceA: 101, now: t0 + HOUR * 0.3, fired }),
    ).toEqual([]);
  });

  test("creator who picked down leads when the price falls", () => {
    const down = bet({ betTerms: { direction: "down" } });
    const found = detectCheckpoints({ bet: down, priceA: 99.5, now: t0, fired: [] });
    expect(found[0]).toMatchObject({ leader: "creator" });
  });

  test("token_vs_token compares % change", () => {
    const vs = bet({
      type: "token_vs_token",
      tokenB: { symbol: "ETH" },
      betTerms: { creatorSide: "tokenB" },
      priceAtStart: 100,
      priceAtStartB: 10,
    });
    // A +1%, B +2%: B (creator's pick) ahead by 1% > buffer.
    const found = detectCheckpoints({ bet: vs, priceA: 101, priceB: 10.2, now: t0, fired: [] });
    expect(found).toEqual([{ key: "lead_1", kind: "lead_change", leader: "creator" }]);
  });
});

describe("recordCheckpoints", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  async function seed(t: TestConvex<typeof schema>) {
    return await t.run(async (ctx) => {
      const user = {
        name: "x",
        avatarUrl: undefined,
        points: 0,
        level: 1,
        xp: 0,
        mu: 25,
        sigma: 8,
        displayRating: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveAt: 0,
      };
      const alice = await ctx.db.insert("users", { ...user, authId: "a", username: "alice" });
      const bob = await ctx.db.insert("users", { ...user, authId: "b", username: "bob" });
      const base = {
        creatorId: alice,
        opponentId: bob,
        type: "hit_price" as const,
        token: { symbol: "BTC" },
        betTerms: { direction: "up" as const, targetPrice: 200 },
        creatorWager: 10,
        opponentWager: 10,
        priceAtCreation: 100,
        priceAtStart: 100,
        startedAt: START,
        duration: "1h" as const,
        expiresAt: START + HOUR,
        resolvesAt: START + HOUR,
        counterCount: 0,
        updatedAt: 0,
      };
      const live = await ctx.db.insert("bets", { ...base, status: "active" });
      const pending = await ctx.db.insert("bets", { ...base, status: "pending" });
      return { live, pending };
    });
  }

  async function eventsFor(t: TestConvex<typeof schema>, betId: Id<"bets">) {
    return await t.run(async (ctx) =>
      ctx.db
        .query("betEvents")
        .withIndex("by_betId_and_key", (q) => q.eq("betId", betId))
        .collect(),
    );
  }

  test("records checkpoints for live bets only, once", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START + HOUR * 0.1);
    const t = convexTest({ schema, modules });
    const { live, pending } = await seed(t);

    const first = await t.mutation(internal.checkpoints.recordCheckpoints, {
      prices: { BTC: 160 },
    });
    expect(first).toBe(1);
    expect(await eventsFor(t, live)).toMatchObject([
      { key: "progress_50", kind: "progress", progress: 50, price: 160 },
    ]);
    expect(await eventsFor(t, pending)).toEqual([]);

    // Same prices again: nothing new.
    const second = await t.mutation(internal.checkpoints.recordCheckpoints, {
      prices: { BTC: 160 },
    });
    expect(second).toBe(0);
  });

  test("skips bets whose token has no price this run", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START + HOUR * 0.6);
    const t = convexTest({ schema, modules });
    const { live } = await seed(t);

    await t.mutation(internal.checkpoints.recordCheckpoints, { prices: { ETH: 1 } });
    expect(await eventsFor(t, live)).toEqual([]);
  });

  test("listForBet: players see events newest first; others and logged-out see none", async () => {
    const t = convexTest({ schema, modules });
    const { live } = await seed(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        authId: "c",
        name: "x",
        username: "carol",
        points: 0,
        level: 1,
        xp: 0,
        mu: 25,
        sigma: 8,
        displayRating: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveAt: 0,
      });
      await ctx.db.insert("betEvents", {
        betId: live,
        key: "progress_50",
        kind: "progress",
        progress: 50,
        at: 1,
        price: 150,
      });
      await ctx.db.insert("betEvents", {
        betId: live,
        key: "halfway",
        kind: "halfway",
        at: 2,
        price: 160,
      });
    });

    const asAlice = await t
      .withIdentity({ subject: "a" })
      .query(api.checkpoints.listForBet, { betId: live });
    expect(asAlice.map((e) => e.key)).toEqual(["halfway", "progress_50"]);

    const asBob = await t
      .withIdentity({ subject: "b" })
      .query(api.checkpoints.listForBet, { betId: live });
    expect(asBob).toHaveLength(2);

    expect(
      await t
        .withIdentity({ subject: "c" })
        .query(api.checkpoints.listForBet, { betId: live }),
    ).toEqual([]);
    expect(await t.query(api.checkpoints.listForBet, { betId: live })).toEqual([]);
  });

  test("records the bet's players on each checkpoint", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(START + HOUR * 0.1);
    const t = convexTest({ schema, modules });
    const { live } = await seed(t);
    await t.mutation(internal.checkpoints.recordCheckpoints, { prices: { BTC: 160 } });
    const bet = await t.run(async (ctx) => ctx.db.get(live));
    expect(await eventsFor(t, live)).toMatchObject([
      { creatorId: bet!.creatorId, opponentId: bet!.opponentId },
    ]);
  });

  test("myFeed: the caller's checkpoints from either side, newest first", async () => {
    const t = convexTest({ schema, modules });
    const { live } = await seed(t);
    await t.run(async (ctx) => {
      const bet = (await ctx.db.get(live))!;
      const players = { creatorId: bet.creatorId, opponentId: bet.opponentId };
      await ctx.db.insert("betEvents", {
        betId: live, key: "progress_50", kind: "progress", progress: 50, at: 1, price: 150, ...players,
      });
      await ctx.db.insert("betEvents", {
        betId: live, key: "halfway", kind: "halfway", at: 2, price: 160, ...players,
      });
      // A checkpoint in someone else's bet: in neither alice's nor bob's feed.
      const profile = {
        name: "x", points: 0, level: 1, xp: 0, mu: 25, sigma: 8, displayRating: 0,
        currentStreak: 0, longestStreak: 0, lastActiveAt: 0,
      };
      const carol = await ctx.db.insert("users", { ...profile, authId: "c", username: "carol" });
      const dave = await ctx.db.insert("users", { ...profile, authId: "d", username: "dave" });
      await ctx.db.insert("betEvents", {
        betId: live, key: "final_stretch", kind: "final_stretch", at: 3, price: 1,
        creatorId: carol, opponentId: dave,
      });
    });

    const asAlice = await t.withIdentity({ subject: "a" }).query(api.checkpoints.myFeed, {});
    expect(asAlice.map((r) => r.event.key)).toEqual(["halfway", "progress_50"]);
    expect(asAlice[0]).toMatchObject({ isCreator: true, rival: "bob" });

    const asBob = await t.withIdentity({ subject: "b" }).query(api.checkpoints.myFeed, {});
    expect(asBob.map((r) => r.event.key)).toEqual(["halfway", "progress_50"]);
    expect(asBob[0]).toMatchObject({ isCreator: false, rival: "alice" });

    expect(await t.query(api.checkpoints.myFeed, {})).toEqual([]);
  });

  test("backfillPlayers: fills old checkpoints and drops orphans", async () => {
    const t = convexTest({ schema, modules });
    const { live, pending } = await seed(t);
    await t.run(async (ctx) => {
      await ctx.db.insert("betEvents", { betId: live, key: "halfway", kind: "halfway", at: 1, price: 1 });
      await ctx.db.insert("betEvents", { betId: pending, key: "halfway", kind: "halfway", at: 1, price: 1 });
      await ctx.db.delete(pending);
    });

    expect(await t.mutation(internal.checkpoints.backfillPlayers, {})).toBe(2);
    expect(await t.mutation(internal.checkpoints.backfillPlayers, {})).toBe(0);
    const bet = await t.run(async (ctx) => ctx.db.get(live));
    expect(await eventsFor(t, live)).toMatchObject([
      { creatorId: bet!.creatorId, opponentId: bet!.opponentId },
    ]);
    expect(await eventsFor(t, pending)).toEqual([]);
  });
});
