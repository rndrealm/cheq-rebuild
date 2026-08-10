import { Id } from "../../../convex/_generated/dataModel";

export type BetStatus =
  | "pending"
  | "countered"
  | "active"
  | "resolved"
  | "tied"
  | "expired"
  | "cancelled"
  | "flagged";

export function getStatusConfig(
  status: BetStatus,
  isWinner: boolean | null,
): { label: string; bg: string; text: string } {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        bg: "bg-warning-light/60",
        text: "text-warning",
      };
    case "countered":
      return {
        label: "Countered",
        bg: "bg-warning-light/60",
        text: "text-warning",
      };
    case "active":
      return { label: "Active", bg: "bg-info-light/60", text: "text-info" };
    case "resolved":
      return isWinner
        ? { label: "Won", bg: "bg-success-light/60", text: "text-success" }
        : {
            label: "Lost",
            bg: "bg-destructive/10",
            text: "text-destructive",
          };
    case "tied":
      return { label: "Tied", bg: "bg-bg-300", text: "text-fg-400" };
    case "expired":
      return { label: "Expired", bg: "bg-bg-300", text: "text-fg-300" };
    case "cancelled":
      return { label: "Cancelled", bg: "bg-bg-300", text: "text-fg-300" };
    case "flagged":
      return {
        label: "Flagged",
        bg: "bg-destructive/10",
        text: "text-destructive",
      };
  }
}

export type BetType = "up_down" | "hit_price" | "token_vs_token";

export type Token = {
  address: string;
  symbol: string;
  chain: string;
  pairAddress: string;
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

export function getBetDescription(bet: FeedBet): {
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
