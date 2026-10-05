"use client";

import { TokenCard } from "@/components/token-card";
import type { FeedBet } from "@/lib/helpers/bets";
import type { Id } from "../../../convex/_generated/dataModel";

const MOCK_BET: FeedBet = {
  _id: "demo_bet_001" as Id<"bets">,
  creatorId: "demo_user_001" as Id<"users">,
  type: "up_down",
  status: "active",
  token: {
    address: "0x0000",
    symbol: "ETH",
    chain: "sol",
    pairAddress: "0x0000",
  },
  betTerms: { direction: "up" },
  creatorWager: 50,
  opponentWager: 50,
  duration: "24h",
  creator: { name: "M. Doom", username: "mdoom" },
  opponent: null,
};

export default function DemoPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f6f6f6] p-8">
      <TokenCard bet={MOCK_BET} />
    </div>
  );
}
