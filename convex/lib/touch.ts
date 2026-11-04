import type { Doc } from "../_generated/dataModel";

type TouchTerms = Pick<Doc<"bets">["betTerms"], "direction" | "targetPrice">;

// "Over" (direction "up", the default for older bets) hits at or above the
// target; "Under" (direction "down") hits at or below it.
export function isTargetHit(terms: TouchTerms, price: number): boolean {
  if (terms.targetPrice === undefined) return false;
  return terms.direction === "down"
    ? price <= terms.targetPrice
    : price >= terms.targetPrice;
}
