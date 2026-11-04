import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { api, internal } from "../_generated/api";
import { modules } from "../test.setup";

describe("points", () => {
  test("list returns only the caller's transactions", async () => {
    const t = convexTest({ schema, modules });
    const aliceId = await t.mutation(internal.users.create, {
      authId: "auth_alice",
      name: "Alice",
      username: "alice",
    });
    await t.mutation(internal.users.create, {
      authId: "auth_bob",
      name: "Bob",
      username: "bob",
    });

    const txns = await t
      .withIdentity({ subject: "auth_alice" })
      .query(api.points.list, {});
    expect(txns).toHaveLength(1);
    expect(txns[0].userId).toBe(aliceId);
    expect(txns[0].type).toBe("registration_bonus");
  });

  test("list returns empty when logged out", async () => {
    const t = convexTest({ schema, modules });
    await t.mutation(internal.users.create, {
      authId: "auth_alice",
      name: "Alice",
      username: "alice",
    });

    expect(await t.query(api.points.list, {})).toEqual([]);
  });
});
