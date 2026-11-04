import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "../schema";
import { api, internal } from "../_generated/api";
import { modules } from "../test.setup";

async function seed(t: ReturnType<typeof convexTest>) {
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
  const [aliceNote, bobNote] = await t.run(async (ctx) => {
    const base = {
      type: "challenge_received" as const,
      title: "New Challenge!",
      body: "test",
      read: false,
    };
    return Promise.all([
      ctx.db.insert("notifications", { ...base, userId: aliceId }),
      ctx.db.insert("notifications", { ...base, userId: bobId }),
    ]);
  });
  return { aliceNote, bobNote };
}

describe("notifications", () => {
  test("markRead marks the caller's notification", async () => {
    const t = convexTest({ schema, modules });
    const { aliceNote } = await seed(t);

    await t
      .withIdentity({ subject: "auth_alice" })
      .mutation(api.notifications.markRead, { notificationId: aliceNote });

    const note = await t.run((ctx) => ctx.db.get(aliceNote));
    expect(note!.read).toBe(true);
  });

  test("markRead on someone else's notification throws", async () => {
    const t = convexTest({ schema, modules });
    const { bobNote } = await seed(t);

    await expect(
      t
        .withIdentity({ subject: "auth_alice" })
        .mutation(api.notifications.markRead, { notificationId: bobNote }),
    ).rejects.toThrow("Notification not found");

    const note = await t.run((ctx) => ctx.db.get(bobNote));
    expect(note!.read).toBe(false);
  });

  test("markAllRead only touches the caller's notifications", async () => {
    const t = convexTest({ schema, modules });
    const { aliceNote, bobNote } = await seed(t);

    await t
      .withIdentity({ subject: "auth_alice" })
      .mutation(api.notifications.markAllRead, {});

    const [alice, bob] = await t.run((ctx) =>
      Promise.all([ctx.db.get(aliceNote), ctx.db.get(bobNote)]),
    );
    expect(alice!.read).toBe(true);
    expect(bob!.read).toBe(false);
  });

  test("markAllRead requires authentication", async () => {
    const t = convexTest({ schema, modules });
    await seed(t);

    await expect(
      t.mutation(api.notifications.markAllRead, {}),
    ).rejects.toThrow("Not authenticated");
  });

  test("list / unread / unreadCount return only the caller's notifications", async () => {
    const t = convexTest({ schema, modules });
    const { aliceNote } = await seed(t);
    const asAlice = t.withIdentity({ subject: "auth_alice" });

    const list = await asAlice.query(api.notifications.list, {});
    expect(list.map((n) => n._id)).toEqual([aliceNote]);

    const unread = await asAlice.query(api.notifications.unread, {});
    expect(unread.map((n) => n._id)).toEqual([aliceNote]);

    expect(await asAlice.query(api.notifications.unreadCount, {})).toBe(1);
  });

  test("notification queries return empty when logged out", async () => {
    const t = convexTest({ schema, modules });
    await seed(t);

    expect(await t.query(api.notifications.list, {})).toEqual([]);
    expect(await t.query(api.notifications.unread, {})).toEqual([]);
    expect(await t.query(api.notifications.unreadCount, {})).toBe(0);
  });
});
