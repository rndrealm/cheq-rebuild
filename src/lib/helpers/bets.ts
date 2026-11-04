import { Id } from "../../../convex/_generated/dataModel";
import { formatPrice } from "./format";

export type BetStatus =
  | "pending"
  | "countered"
  | "active"
  | "resolved"
  | "tied"
  | "expired"
  | "cancelled"
  | "flagged";

export type StatusConfig = {
  label: string;
  text: string;
  border: string;
  gradient: string;
  insetShadow: string;
  textShadow: string;
};

export function getStatusConfig(
  status: BetStatus,
  isWinner: boolean | null,
): StatusConfig {
  switch (status) {
    case "pending":
    case "countered":
      return {
        label: status === "pending" ? "Pending" : "Countered",
        text: "text-[#d97706]",
        border: "border-[#fdd889]",
        gradient: "from-[#fdd889] from-[29%] to-[#fcc85c]",
        insetShadow:
          "shadow-[inset_-1px_-1px_0px_0px_#f5ba3b,inset_1px_1px_0px_0px_#feeec4]",
        textShadow: "[text-shadow:0px_0.5px_0px_#f5c23b]",
      };
    case "active":
      return {
        label: "Active",
        text: "text-[#059fff]",
        border: "border-[#a6d2ff]",
        gradient: "from-[#a6d2ff] from-[29%] to-[#85c1ff]",
        insetShadow:
          "shadow-[inset_-1px_-1px_0px_0px_#70b8ff,inset_1px_1px_0px_0px_#dbedff]",
        textShadow: "[text-shadow:0px_0.5px_0px_#72b8fe]",
      };
    case "resolved":
      return isWinner
        ? {
            label: "Won",
            text: "text-[#16a34a]",
            border: "border-[#86efac]",
            gradient: "from-[#86efac] from-[29%] to-[#6be096]",
            insetShadow:
              "shadow-[inset_-1px_-1px_0px_0px_#4ad67f,inset_1px_1px_0px_0px_#c5f5d6]",
            textShadow: "[text-shadow:0px_0.5px_0px_#4ad680]",
          }
        : {
            label: "Lost",
            text: "text-loss-11",
            border: "border-loss-7",
            gradient: "from-loss-6 from-[29%] to-loss-7",
            insetShadow:
              "shadow-[inset_-1px_-1px_0px_0px_var(--loss-8),inset_1px_1px_0px_0px_var(--loss-4)]",
            textShadow: "[text-shadow:0px_0.5px_0px_var(--loss-8)]",
          };
    case "tied":
    case "expired":
    case "cancelled":
      return {
        label:
          status === "tied"
            ? "Tied"
            : status === "expired"
              ? "Expired"
              : "Cancelled",
        text: "text-[#737373]",
        border: "border-[#d4d4d4]",
        gradient: "from-[#e5e5e5] from-[29%] to-[#d4d4d4]",
        insetShadow:
          "shadow-[inset_-1px_-1px_0px_0px_#c4c4c4,inset_1px_1px_0px_0px_#f0f0f0]",
        textShadow: "[text-shadow:0px_0.5px_0px_#c4c4c4]",
      };
    case "flagged":
      return {
        label: "Flagged",
        text: "text-[#dc2626]",
        border: "border-[#fca5a5]",
        gradient: "from-[#fca5a5] from-[29%] to-[#f87171]",
        insetShadow:
          "shadow-[inset_-1px_-1px_0px_0px_#ef5350,inset_1px_1px_0px_0px_#fdd]",
        textShadow: "[text-shadow:0px_0.5px_0px_#ef5350]",
      };
  }
}

export type BetType = "up_down" | "hit_price" | "token_vs_token";

export type Token = {
  symbol: string;
};

export type BetTerms = {
  direction?: "up" | "down";
  targetPrice?: number;
  creatorSide?: "tokenA" | "tokenB";
};

export type FeedBet = {
  _id: Id<"bets">;
  creatorId: Id<"users">;
  opponentId?: Id<"users">;
  type: BetType;
  status: BetStatus;
  token: Token;
  tokenB?: Token;
  betTerms: BetTerms;
  creatorWager: number;
  opponentWager: number;
  winnerId?: Id<"users">;
  duration: string;
  creator: { name: string; username: string } | null;
  opponent: { name: string; username: string } | null;
};

export function getBetDescription(
  bet: Pick<FeedBet, "type" | "token" | "tokenB" | "betTerms">,
): {
  label: string;
  value: string;
} {
  switch (bet.type) {
    case "up_down":
      return {
        label: `${bet.token.symbol} goes`,
        value: bet.betTerms.direction === "up" ? "UP" : "DOWN",
      };
    case "hit_price":
      return {
        label: `${bet.token.symbol} hits`,
        value: `$${bet.betTerms.targetPrice}`,
      };
    case "token_vs_token":
      return {
        label: `${bet.token.symbol} vs ${bet.tokenB?.symbol}`,
        value:
          bet.betTerms.creatorSide === "tokenA"
            ? bet.token.symbol
            : (bet.tokenB?.symbol ?? ""),
      };
  }
}

// What each side is betting on, worded from the viewer's side. The creator
// picks the terms; the opponent takes the opposite outcome. On hit_price the
// creator wins if the target is touched, the opponent if the deadline passes
// first.
export function getPositions(
  bet: Pick<FeedBet, "type" | "token" | "tokenB" | "betTerms">,
  isCreator: boolean,
): { mine: string; theirs: string } {
  const symbol = bet.token.symbol;
  let creator: string;
  let opponent: string;

  switch (bet.type) {
    case "up_down": {
      const up = bet.betTerms.direction === "up";
      creator = `${symbol} goes ${up ? "up" : "down"}`;
      opponent = `${symbol} goes ${up ? "down" : "up"}`;
      break;
    }
    case "hit_price": {
      const target =
        bet.betTerms.targetPrice !== undefined
          ? formatPrice(bet.betTerms.targetPrice)
          : "target";
      const under = bet.betTerms.direction === "down";
      creator = under ? `${symbol} drops to ${target}` : `${symbol} hits ${target}`;
      opponent = under
        ? `${symbol} stays above ${target}`
        : `${symbol} stays below ${target}`;
      break;
    }
    case "token_vs_token": {
      const a = symbol;
      const b = bet.tokenB?.symbol ?? "";
      const creatorPicksA = bet.betTerms.creatorSide === "tokenA";
      creator = creatorPicksA ? `${a} beats ${b}` : `${b} beats ${a}`;
      opponent = creatorPicksA ? `${b} beats ${a}` : `${a} beats ${b}`;
      break;
    }
  }

  return isCreator
    ? { mine: creator, theirs: opponent }
    : { mine: opponent, theirs: creator };
}

// Live countdown: "2d 4h", "3h 12m", then "12:04" in the final hour.
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const DURATION_LABELS: Record<string, string> = {
  "1h": "1 Hour",
  "4h": "4 Hours",
  "24h": "24 Hours",
  "3d": "3 Days",
  "1w": "1 Week",
};

export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
