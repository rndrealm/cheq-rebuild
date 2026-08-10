import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { api } from "../_generated/api";
import { modules } from "../test.setup";
import { makeUser } from "./helpers";

describe("leaderboards", () => {
  test("topRated returns users sorted by displayRating desc", async () => {
    const t = convexTest({ schema, modules });

    await t.run(async (ctx) => {
      await ctx.db.insert(
        "users",
        makeUser({ authId: "a", username: "low", displayRating: 10 }),
      );
      await ctx.db.insert(
        "users",
        makeUser({ authId: "b", username: "high", displayRating: 50 }),
      );
      await ctx.db.insert(
        "users",
        makeUser({ authId: "c", username: "mid", displayRating: 30 }),
      );
    });

    const result = await t.query(api.leaderboards.topRated, {});
    expect(result).toHaveLength(3);
    expect(result[0].username).toBe("high");
    expect(result[1].username).toBe("mid");
    expect(result[2].username).toBe("low");
  });

  test("sharpest filters by min 10 bets and sorts by win rate", async () => {
    const t = convexTest({ schema, modules });

    await t.run(async (ctx) => {
      await ctx.db.insert(
        "users",
        makeUser({
          authId: "a",
          username: "sharp",
          totalWins: 8,
          totalBetsResolved: 10,
          points: 1000,
        }),
      );
      await ctx.db.insert(
        "users",
        makeUser({
          authId: "b",
          username: "decent",
          totalWins: 6,
          totalBetsResolved: 12,
          points: 900,
        }),
      );
      await ctx.db.insert(
        "users",
        makeUser({
          authId: "c",
          username: "newbie",
          totalWins: 5,
          totalBetsResolved: 5,
          points: 800,
        }),
      );
    });

    const result = await t.query(api.leaderboards.sharpest, {});
    expect(result).toHaveLength(2);
    expect(result[0].username).toBe("sharp");
    expect(result[1].username).toBe("decent");
  });

  test("onFire returns users sorted by currentStreak desc", async () => {
    const t = convexTest({ schema, modules });

    await t.run(async (ctx) => {
      await ctx.db.insert(
        "users",
        makeUser({ authId: "a", username: "cold", currentStreak: 1 }),
      );
      await ctx.db.insert(
        "users",
        makeUser({ authId: "b", username: "hot", currentStreak: 10 }),
      );
      await ctx.db.insert(
        "users",
        makeUser({ authId: "c", username: "warm", currentStreak: 5 }),
      );
    });

    const result = await t.query(api.leaderboards.onFire, {});
    expect(result).toHaveLength(3);
    expect(result[0].username).toBe("hot");
    expect(result[1].username).toBe("warm");
    expect(result[2].username).toBe("cold");
  });
});
