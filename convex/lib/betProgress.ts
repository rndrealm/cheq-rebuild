// Live progress of a bet: its window, baseline prices and who is ahead.
// Shared with the frontend, so keep this file free of server imports.
import type { Doc } from "../_generated/dataModel";
import { DURATION_MS } from "./constants";
import { isTargetHit } from "./touch";

type ProgressBet = Pick<
  Doc<"bets">,
  | "type"
  | "betTerms"
  | "duration"
  | "resolvesAt"
  | "startedAt"
  | "priceAtStart"
  | "priceAtStartB"
  | "priceAtCreation"
  | "priceAtCreationB"
>;

export type Standing = "winning" | "losing" | "even";

// The bet runs from acceptance (`startedAt`) to `resolvesAt`. Bets accepted
// before `startedAt` existed fall back to the duration.
export function getBetWindow(bet: ProgressBet): { start: number; end: number } {
  const end = bet.resolvesAt;
  const start = bet.startedAt ?? end - (DURATION_MS[bet.duration] ?? 0);
  return { start, end };
}

// Baseline prices for settlement; older bets fall back to the creation price.
export function getStartPrices(bet: ProgressBet): { a: number; b?: number } {
  return {
    a: bet.priceAtStart ?? bet.priceAtCreation,
    b: bet.priceAtStartB ?? bet.priceAtCreationB,
  };
}

export function percentChange(from: number, to: number): number {
  return ((to - from) / from) * 100;
}

// Who would win if the bet settled at these prices, from the viewer's side.
// Mirrors `determineSnapshotWinner` / `isTargetHit` on the server.
export function getStanding(
  bet: ProgressBet,
  isCreator: boolean,
  latestA: number,
  latestB?: number,
): Standing {
  const start = getStartPrices(bet);
  let creatorAhead: boolean | null;

  switch (bet.type) {
    case "up_down": {
      if (latestA === start.a) {
        creatorAhead = null;
      } else {
        const wentUp = latestA > start.a;
        creatorAhead = bet.betTerms.direction === "up" ? wentUp : !wentUp;
      }
      break;
    }
    case "hit_price":
      // The creator only wins by touching the target; until then the
      // opponent is ahead.
      creatorAhead = isTargetHit(bet.betTerms, latestA);
      break;
    case "token_vs_token": {
      if (latestB === undefined || start.b === undefined) {
        creatorAhead = null;
        break;
      }
      // Same raw ratio as `determineSnapshotWinner`, so float rounding can't
      // make the two disagree on a near-tie.
      const changeA = (latestA - start.a) / start.a;
      const changeB = (latestB - start.b) / start.b;
      if (changeA === changeB) {
        creatorAhead = null;
      } else {
        const aAhead = changeA > changeB;
        creatorAhead = bet.betTerms.creatorSide === "tokenA" ? aAhead : !aAhead;
      }
      break;
    }
  }

  if (creatorAhead === null) return "even";
  return creatorAhead === isCreator ? "winning" : "losing";
}

// How far the price still has to move to touch a hit_price target, as a
// percentage of the current price. 0 once reached.
export function distanceToTarget(
  bet: Pick<Doc<"bets">, "betTerms">,
  latest: number,
): number | null {
  const target = bet.betTerms.targetPrice;
  if (target === undefined) return null;
  if (isTargetHit(bet.betTerms, latest)) return 0;
  return Math.abs(percentChange(latest, target));
}
