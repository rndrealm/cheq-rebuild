import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { api } from "../_generated/api";
import { modules } from "../test.setup";
import { REGISTRATION_BONUS } from "../lib/constants";

describe("users", () => {
  test("create assigns registration bonus and defaults", async () => {
    const t = convexTest({ schema, modules });
    const userId = await t.mutation(api.users.create, {
      authId: "auth1",
      name: "Alice",
      username: "alice",
    });
    const user = await t.query(api.users.getById, { userId });
    expect(user).not.toBeNull();
    expect(user!.points).toBe(REGISTRATION_BONUS);
    expect(user!.level).toBe(1);
    expect(user!.xp).toBe(0);
    expect(user!.currentStreak).toBe(0);
  });

  test("create records registration_bonus transaction", async () => {
    const t = convexTest({ schema, modules });
    const userId = await t.mutation(api.users.create, {
      authId: "auth1",
      name: "Alice",
      username: "alice",
    });
    const txns = await t.run(async (ctx) => {
      return ctx.db
        .query("pointTransactions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
    });
    expect(txns).toHaveLength(1);
    expect(txns[0].type).toBe("registration_bonus");
    expect(txns[0].amount).toBe(REGISTRATION_BONUS);
  });

  test("duplicate username throws", async () => {
    const t = convexTest({ schema, modules });
    await t.mutation(api.users.create, {
      authId: "auth1",
      name: "Alice",
      username: "alice",
    });
    await expect(
      t.mutation(api.users.create, {
        authId: "auth2",
        name: "Bob",
        username: "alice",
      }),
    ).rejects.toThrow("Username already taken");
  });

  test("getByAuthId returns user", async () => {
    const t = convexTest({ schema, modules });
    await t.mutation(api.users.create, {
      authId: "auth1",
      name: "Alice",
      username: "alice",
    });
    const user = await t.query(api.users.getByAuthId, { authId: "auth1" });
    expect(user).not.toBeNull();
    expect(user!.username).toBe("alice");
  });

  test("getByUsername returns user", async () => {
    const t = convexTest({ schema, modules });
    await t.mutation(api.users.create, {
      authId: "auth1",
      name: "Alice",
      username: "alice",
    });
    const user = await t.query(api.users.getByUsername, {
      username: "alice",
    });
    expect(user).not.toBeNull();
    expect(user!.authId).toBe("auth1");
  });

  test("updateProfile changes fields", async () => {
    const t = convexTest({ schema, modules });
    const userId = await t.mutation(api.users.create, {
      authId: "auth1",
      name: "Alice",
      username: "alice",
    });
    await t.mutation(api.users.updateProfile, {
      userId,
      name: "Alice Updated",
      username: "alice_v2",
    });
    const user = await t.query(api.users.getById, { userId });
    expect(user!.name).toBe("Alice Updated");
    expect(user!.username).toBe("alice_v2");
  });

  test("updateProfile with taken username throws", async () => {
    const t = convexTest({ schema, modules });
    const aliceId = await t.mutation(api.users.create, {
      authId: "auth1",
      name: "Alice",
      username: "alice",
    });
    await t.mutation(api.users.create, {
      authId: "auth2",
      name: "Bob",
      username: "bob",
    });
    await expect(
      t.mutation(api.users.updateProfile, {
        userId: aliceId,
        username: "bob",
      }),
    ).rejects.toThrow("Username already taken");
  });
});
