import { describe, expect, test } from "vitest";
import {
  distanceToTarget,
  getBetWindow,
  getStanding,
  getStartPrices,
} from "../lib/betProgress";
import type { Doc } from "../_generated/dataModel";

type Bet = Parameters<typeof getStanding>[0];

function bet(overrides: Partial<Doc<"bets">>): Bet {
  return {
    type: "up_down",
    betTerms: { direction: "up" },
    duration: "1h",
    resolvesAt: 10_000_000,
    startedAt: 10_000_000 - 3_600_000,
    priceAtStart: 100,
    priceAtCreation: 90,
    ...overrides,
  } as Bet;
}

describe("getStanding", () => {
  test("up_down: creator who picked up is winning when price rises", () => {
    const b = bet({ betTerms: { direction: "up" } });
    expect(getStanding(b, true, 101)).toBe("winning");
    expect(getStanding(b, false, 101)).toBe("losing");
    expect(getStanding(b, true, 99)).toBe("losing");
  });

  test("up_down: creator who picked down is winning when price falls", () => {
    const b = bet({ betTerms: { direction: "down" } });
    expect(getStanding(b, true, 99)).toBe("winning");
    expect(getStanding(b, false, 99)).toBe("losing");
  });

  test("up_down: flat price is even", () => {
    expect(getStanding(bet({}), true, 100)).toBe("even");
  });

  test("up_down: uses the start price, not the creation price", () => {
    // Above creation (90) but below start (100): the creator (up) is losing.
    expect(getStanding(bet({}), true, 95)).toBe("losing");
  });

  test("hit_price: opponent is ahead until the target is touched", () => {
    const b = bet({
      type: "hit_price",
      betTerms: { direction: "up", targetPrice: 120 },
    });
    expect(getStanding(b, true, 119)).toBe("losing");
    expect(getStanding(b, false, 119)).toBe("winning");
    expect(getStanding(b, true, 120)).toBe("winning");
  });

  test("hit_price under: hits at or below the target", () => {
    const b = bet({
      type: "hit_price",
      betTerms: { direction: "down", targetPrice: 80 },
    });
    expect(getStanding(b, true, 81)).toBe("losing");
    expect(getStanding(b, true, 80)).toBe("winning");
  });

  test("token_vs_token: compares % change from each start", () => {
    const b = bet({
      type: "token_vs_token",
      betTerms: { creatorSide: "tokenA" },
      priceAtStart: 100,
      priceAtStartB: 10,
    });
    // A +1%, B +5%: B ahead, so the creator (picked A) is losing.
    expect(getStanding(b, true, 101, 10.5)).toBe("losing");
    expect(getStanding(b, false, 101, 10.5)).toBe("winning");
    // A +50%, B +50% (exact in floating point): even.
    expect(getStanding(b, true, 150, 15)).toBe("even");
  });
});

describe("getBetWindow / getStartPrices", () => {
  test("window runs from startedAt to resolvesAt", () => {
    expect(getBetWindow(bet({}))).toEqual({
      start: 10_000_000 - 3_600_000,
      end: 10_000_000,
    });
  });

  test("older bets without startedAt fall back to the duration", () => {
    expect(getBetWindow(bet({ startedAt: undefined, duration: "4h" }))).toEqual({
      start: 10_000_000 - 4 * 3_600_000,
      end: 10_000_000,
    });
  });

  test("older bets without a start price fall back to the creation price", () => {
    expect(getStartPrices(bet({ priceAtStart: undefined })).a).toBe(90);
  });
});

describe("distanceToTarget", () => {
  test("percent of the current price still to go, 0 once hit", () => {
    const terms = { betTerms: { direction: "up" as const, targetPrice: 110 } };
    expect(distanceToTarget(terms, 100)).toBeCloseTo(10);
    expect(distanceToTarget(terms, 110)).toBe(0);
  });
});
