// Checkpoint detection for live bets. Pure (no db, no network) so it's easy to
// test; the poller in convex/checkpoints.ts feeds it prices and saves results.
import type { Doc } from "../_generated/dataModel";
import { getBetWindow, getStartPrices } from "./betProgress";
import { isTargetHit } from "./touch";

export type CheckpointKind = Doc<"betEvents">["kind"];
export type Leader = "creator" | "opponent";

// What's already been recorded for the bet (only the fields detection needs).
export type FiredEvent = Pick<
  Doc<"betEvents">,
  "key" | "kind" | "at" | "progress" | "leader"
>;

export type NewCheckpoint = {
  key: string;
  kind: CheckpointKind;
  progress?: number;
  leader?: Leader;
};

type CheckpointBet = Parameters<typeof getBetWindow>[0];

// hit_price: share of the way from the start price to the target.
export const PROGRESS_THRESHOLDS = [50, 75, 90] as const;
// hit_price: "almost there", as a fraction of the current price.
export const NEAR_TARGET = 0.01;
// Time: halfway, and the final 10% of the window.
export const FINAL_STRETCH = 0.1;

// Lead changes need the new leader to be clearly ahead, by at least this much
// (as a fraction of the start price, or of % change for token-vs-token), so a
// price hovering around the start doesn't flip the lead every 30s. Scaled to
// how much prices typically move over each duration.
export const LEAD_BUFFER: Record<string, number> = {
  "1h": 0.0005,
  "4h": 0.001,
  "24h": 0.002,
  "3d": 0.003,
  "1w": 0.005,
};
// …and some time must pass between lead changes: 2% of the window, at least
// a minute (≈72s for 1h, ≈3.4h for 1w).
export const LEAD_MIN_GAP_SHARE = 0.02;
export const LEAD_MIN_GAP_MS = 60_000;
// Hard cap so a choppy market can't fill the feed.
export const MAX_LEAD_CHANGES = 12;

/**
 * New checkpoints for a live bet at these prices and this time. Returns only
 * checkpoints not already in `fired`; at most one of each kind per call.
 */
export function detectCheckpoints({
  bet,
  priceA,
  priceB,
  now,
  fired,
}: {
  bet: CheckpointBet;
  priceA: number;
  priceB?: number;
  now: number;
  fired: FiredEvent[];
}): NewCheckpoint[] {
  const betWindow = getBetWindow(bet);
  if (now < betWindow.start || now >= betWindow.end) return [];

  const firedKeys = new Set(fired.map((e) => e.key));
  const found: NewCheckpoint[] = [];

  // Time checkpoints (all bet types).
  const elapsed = (now - betWindow.start) / (betWindow.end - betWindow.start);
  if (elapsed >= 1 - FINAL_STRETCH) {
    if (!firedKeys.has("final_stretch")) {
      found.push({ key: "final_stretch", kind: "final_stretch" });
    }
  } else if (elapsed >= 0.5 && !firedKeys.has("halfway")) {
    found.push({ key: "halfway", kind: "halfway" });
  }

  if (bet.type === "hit_price") {
    found.push(...detectTargetProgress(bet, priceA, fired, firedKeys));
  } else {
    const lead = detectLeadChange(bet, priceA, priceB, now, fired);
    if (lead) found.push(lead);
  }

  return found;
}

function detectTargetProgress(
  bet: CheckpointBet,
  price: number,
  fired: FiredEvent[],
  firedKeys: Set<string>,
): NewCheckpoint[] {
  const target = bet.betTerms.targetPrice;
  if (target === undefined) return [];
  // A hit settles the bet (the touch poller), so there's nothing to report.
  if (isTargetHit(bet.betTerms, price)) return [];

  const start = getStartPrices(bet).a;
  const found: NewCheckpoint[] = [];

  // Share of the distance covered. Negative if it moved the wrong way.
  const progress = ((price - start) / (target - start)) * 100;
  const highestFired = Math.max(
    0,
    ...fired.filter((e) => e.kind === "progress").map((e) => e.progress ?? 0),
  );
  // If the price jumped past several thresholds at once, report only the
  // highest; lower ones are then skipped for good (no "50%" after "75%").
  const crossed = PROGRESS_THRESHOLDS.filter(
    (t) => progress >= t && t > highestFired,
  );
  const next = crossed[crossed.length - 1];
  if (next !== undefined) {
    found.push({ key: `progress_${next}`, kind: "progress", progress: next });
  }

  if (
    Math.abs(target - price) / price <= NEAR_TARGET &&
    !firedKeys.has("near_target")
  ) {
    found.push({ key: "near_target", kind: "near_target" });
  }

  return found;
}

// How far the creator is ahead: positive = creator, negative = opponent.
// up_down: move from the start price in the creator's direction.
// token_vs_token: the creator's pick's % change minus the other's.
export function creatorMargin(
  bet: CheckpointBet,
  priceA: number,
  priceB?: number,
): number | null {
  const start = getStartPrices(bet);
  if (bet.type === "up_down") {
    const move = (priceA - start.a) / start.a;
    return bet.betTerms.direction === "down" ? -move : move;
  }
  if (bet.type === "token_vs_token") {
    if (priceB === undefined || start.b === undefined) return null;
    const diff = (priceA - start.a) / start.a - (priceB - start.b) / start.b;
    return bet.betTerms.creatorSide === "tokenB" ? -diff : diff;
  }
  return null;
}

function detectLeadChange(
  bet: CheckpointBet,
  priceA: number,
  priceB: number | undefined,
  now: number,
  fired: FiredEvent[],
): NewCheckpoint | null {
  const margin = creatorMargin(bet, priceA, priceB);
  if (margin === null) return null;

  const buffer = LEAD_BUFFER[bet.duration] ?? 0.001;
  const clearLeader: Leader | null =
    margin > buffer ? "creator" : margin < -buffer ? "opponent" : null;
  if (!clearLeader) return null;

  const leads = fired
    .filter((e) => e.kind === "lead_change")
    .sort((a, b) => a.at - b.at);
  const last = leads[leads.length - 1];
  if (last?.leader === clearLeader) return null;
  if (leads.length >= MAX_LEAD_CHANGES) return null;

  if (last) {
    const betWindow = getBetWindow(bet);
    const minGap = Math.max(
      LEAD_MIN_GAP_MS,
      (betWindow.end - betWindow.start) * LEAD_MIN_GAP_SHARE,
    );
    if (now - last.at < minGap) return null;
  }

  return {
    key: `lead_${leads.length + 1}`,
    kind: "lead_change",
    leader: clearLeader,
  };
}
