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
            text: "text-[#dc2626]",
            border: "border-[#fca5a5]",
            gradient: "from-[#fca5a5] from-[29%] to-[#f87171]",
            insetShadow:
              "shadow-[inset_-1px_-1px_0px_0px_#ef5350,inset_1px_1px_0px_0px_#fdd]",
            textShadow: "[text-shadow:0px_0.5px_0px_#ef5350]",
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
