// Wording of checkpoint updates (frontend helper; tested here because vitest
// only runs convex/**).
import { describe, expect, test } from "vitest";
import type { Doc, Id } from "../_generated/dataModel";
import { describeEvent } from "../../src/lib/helpers/bet-events";

type EventBet = Parameters<typeof describeEvent>[1];

const upDown = {
  type: "up_down",
  token: { symbol: "BTC" },
  betTerms: { direction: "up" },
  duration: "1h",
  startedAt: 0,
  resolvesAt: 3_600_000,
  priceAtStart: 100,
  priceAtCreation: 100,
} as EventBet;

const hit = {
  ...upDown,
  type: "hit_price",
  betTerms: { direction: "up", targetPrice: 200 },
} as EventBet;

function event(fields: Partial<Doc<"betEvents">>): Doc<"betEvents"> {
  return {
    _id: "e1" as Id<"betEvents">,
    _creationTime: 0,
    betId: "b1" as Id<"bets">,
    key: "k",
    kind: "halfway",
    at: 0,
    price: 100,
    ...fields,
  };
}

describe("describeEvent", () => {
  test("lead change reads from each player's side", () => {
    const e = event({ kind: "lead_change", leader: "creator", price: 101 });
    expect(describeEvent(e, upDown, true, "@bob")).toMatchObject({
      title: "You took the lead",
      tone: "good",
    });
    expect(describeEvent(e, upDown, false, "@alice")).toMatchObject({
      title: "@alice took the lead",
      tone: "bad",
    });
  });

  test("lead change body has the price and move", () => {
    const e = event({ kind: "lead_change", leader: "creator", price: 101 });
    expect(describeEvent(e, upDown, true, "@bob").body).toBe(
      "BTC at $101.00 (+1.00%).",
    );
  });

  test("progress is good for the chaser, bad for the opponent", () => {
    const e = event({ kind: "progress", progress: 75, price: 175 });
    const creator = describeEvent(e, hit, true, "@bob");
    expect(creator.title).toBe("BTC is 75% of the way to $200.00");
    expect(creator.tone).toBe("good");
    expect(describeEvent(e, hit, false, "@alice").tone).toBe("bad");
  });

  test("halfway reports who was ahead at that moment", () => {
    const e = event({ kind: "halfway", price: 99 });
    expect(describeEvent(e, upDown, true, "@bob")).toMatchObject({
      title: "Halfway there",
      tone: "bad",
    });
    expect(describeEvent(e, upDown, true, "@bob").body).toMatch(/^@bob is ahead\./);
    expect(describeEvent(e, upDown, false, "@alice").body).toMatch(/^You're ahead\./);
  });

  test("final stretch on hit_price: opponent holding", () => {
    const e = event({ kind: "final_stretch", price: 150 });
    expect(describeEvent(e, hit, false, "@alice")).toMatchObject({
      title: "Final stretch",
      tone: "good",
    });
    expect(describeEvent(e, hit, false, "@alice").body).toMatch(
      /^Target not reached yet\./,
    );
    expect(describeEvent(e, hit, true, "@bob").body).toMatch(
      /^Still short of the target\./,
    );
  });
});
