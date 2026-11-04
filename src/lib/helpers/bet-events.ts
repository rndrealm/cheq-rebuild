import type { Doc } from "../../../convex/_generated/dataModel";
import { getStanding, percentChange, getStartPrices } from "./bet-progress";
import { formatPrice } from "./format";

export type EventTone = "good" | "bad" | "neutral";

export type EventCopy = {
  title: string;
  body: string;
  tone: EventTone;
};

type EventBet = Parameters<typeof getStanding>[0] &
  Pick<Doc<"bets">, "token" | "tokenB">;

/**
 * Words a checkpoint from the viewer's side. Events are stored as neutral
 * facts ("creator took the lead"), so both players see the same event worded
 * for them ("You took the lead" / "@alice took the lead").
 */
export function describeEvent(
  event: Doc<"betEvents">,
  bet: EventBet,
  isCreator: boolean,
  rivalName: string,
): EventCopy {
  const symbol = bet.token.symbol;
  const target = bet.betTerms.targetPrice;
  const targetText = target !== undefined ? formatPrice(target) : "the target";
  // On hit_price the creator is chasing the target; the opponent wants it missed.
  const chasing = isCreator;

  switch (event.kind) {
    case "progress":
      return {
        title: `${symbol} is ${event.progress}% of the way to ${targetText}`,
        body: chasing ? "Keep it coming." : "It's getting closer.",
        tone: chasing ? "good" : "bad",
      };

    case "near_target":
      return {
        title: `${symbol} is within 1% of ${targetText}`,
        body: chasing ? "Almost there." : "Hold on.",
        tone: chasing ? "good" : "bad",
      };

    case "lead_change": {
      const mine = (event.leader === "creator") === isCreator;
      return {
        title: mine ? "You took the lead" : `${rivalName} took the lead`,
        body: priceContext(event, bet),
        tone: mine ? "good" : "bad",
      };
    }

    case "halfway":
    case "final_stretch": {
      const standing = getStanding(bet, isCreator, event.price, event.priceB);
      const title = event.kind === "halfway" ? "Halfway there" : "Final stretch";
      const body =
        bet.type === "hit_price"
          ? hitStandingText(chasing, standing === "winning")
          : standing === "winning"
            ? "You're ahead."
            : standing === "losing"
              ? `${rivalName} is ahead.`
              : "It's level.";
      return {
        title,
        body: `${body} ${priceContext(event, bet)}`,
        tone:
          standing === "winning" ? "good" : standing === "losing" ? "bad" : "neutral",
      };
    }
  }
}

// hit_price: "winning" means the target was touched for the chaser (creator)
// and not touched for the opponent.
function hitStandingText(chasing: boolean, winning: boolean): string {
  const touched = chasing === winning;
  if (touched) return "Target reached.";
  return chasing ? "Still short of the target." : "Target not reached yet.";
}

// "BTC at $78,649.09 (+0.31%)" or "ETH +1.20% vs SOL +0.40%".
function priceContext(event: Doc<"betEvents">, bet: EventBet): string {
  const start = getStartPrices(bet);
  const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  if (bet.tokenB && event.priceB !== undefined && start.b !== undefined) {
    return `${bet.token.symbol} ${fmt(percentChange(start.a, event.price))} vs ${bet.tokenB.symbol} ${fmt(percentChange(start.b, event.priceB))}.`;
  }
  return `${bet.token.symbol} at ${formatPrice(event.price)} (${fmt(percentChange(start.a, event.price))}).`;
}

export function formatTimeAgo(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
