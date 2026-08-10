"use client";

import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BetCard } from "@/components/bet-card";
import { EmptyState } from "@/components/empty-state";
import { useUser } from "@/components/providers/user-provider";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppRoutes } from "@/lib/routes";

export default function Home() {
  const user = useUser();
  const feed = useQuery(api.bets.feed);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 font-bold text-fg-base">Feed</h1>
          <p className="text-caption text-fg-400">
            {user.points} pts available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={AppRoutes.createBet.path}>
            <Button variant="secondary" size="sm">
              New Bet
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-caption"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {feed === undefined ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-caption text-fg-300">Loading...</p>
        </div>
      ) : feed.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,208px)] justify-center gap-4">
          {feed.map((bet) => (
            <BetCard key={bet._id} bet={bet} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
