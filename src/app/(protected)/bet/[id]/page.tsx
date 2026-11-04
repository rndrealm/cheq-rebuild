"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useUser } from "@/components/providers/user-provider";
import { Button } from "@/components/ui/button";
import { cn, simpleHash } from "@/lib/utils";
import {
  getStatusConfig,
  getBetDescription,
  DURATION_LABELS,
  type BetStatus,
} from "@/lib/helpers/bets";
import { CreatorCard } from "@/components/bet-detail/creator-card";
import { OpponentSection } from "@/components/bet-detail/opponent-section";
import { BetActions } from "@/components/bet-detail/bet-actions";
import { EXPRESSIONS, COLORS } from "@/lib/avatar-shapes";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-caption font-semibold text-fg-base leading-4">
        {label}
      </span>
      <span className="text-caption font-semibold text-fg-base leading-4">
        {value}
      </span>
    </div>
  );
}

export default function BetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useUser();
  const bet = useQuery(api.bets.detail, {
    betId: params.id as Id<"bets">,
  });

  if (bet === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-caption text-fg-300">Loading...</p>
      </div>
    );
  }

  if (bet === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-base font-semibold text-fg-300">Bet not found</p>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Back to Feed
        </Button>
      </div>
    );
  }

  const isCreator = bet.creatorId === user._id;
  const isOpponent = bet.opponentId === user._id;
  const canAccept =
    !isCreator &&
    (bet.status === "pending" || bet.status === "countered") &&
    (!bet.opponentId || isOpponent);
  // Only a named opponent can decline; open challenges can only be accepted.
  const canDecline =
    isOpponent && (bet.status === "pending" || bet.status === "countered");
  const canCancel =
    isCreator && (bet.status === "pending" || bet.status === "countered");
  const canRematch =
    (isCreator || isOpponent) &&
    (bet.status === "resolved" || bet.status === "tied");

  const isWinner =
    bet.status === "resolved" && bet.winnerId
      ? bet.winnerId === user._id
      : null;

  // const statusConfig = getStatusConfig(bet.status as BetStatus, isWinner);
  const statusConfig = getStatusConfig("tied" as BetStatus, isWinner);
  const description = getBetDescription(bet);
  const rewardPool = bet.creatorWager + bet.opponentWager;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-8">
      <div className="hidden items-center  gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-8 items-center justify-center rounded-lg bg-bg-200 text-fg-400 transition-colors hover:bg-bg-300"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-h2 font-bold text-fg-base">Bet Details</h1>
      </div>

      <CreatorCard
        name={bet.creator?.name ?? "Unknown"}
        username={bet.creator?.username}
        wager={bet.creatorWager}
        statusConfig={statusConfig}
        expressionIndex={simpleHash(bet.creatorId) % EXPRESSIONS.length}
        colorIndex={simpleHash(bet.creatorId + "c") % COLORS.length}
      />

      <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card px-5.5 pb-9 pt-5.5">
        <p className="text-caption font-semibold text-fg-base leading-4">
          Positions
        </p>
        <div className="flex flex-col gap-3">
          <InfoRow label={description.label} value={description.value} />
          {/* Bets start on acceptance; until then the creation price is a preview. */}
          <InfoRow
            label={bet.priceAtStart !== undefined ? "Start Price" : "Market Price"}
            value={`$${(bet.priceAtStart ?? bet.priceAtCreation).toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
          />
          <InfoRow
            label="Timeframe"
            value={DURATION_LABELS[bet.duration] ?? bet.duration}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[20px] border border-border bg-card px-5.5 pb-9 pt-5.5">
        <p className="text-caption font-semibold text-fg-base leading-4">
          Stake Details
        </p>
        <div className="flex flex-col gap-3">
          <InfoRow label={description.label} value={description.value} />
          <InfoRow label="Total Stake" value={`${bet.creatorWager} Points`} />
          <InfoRow label="Reward Pool" value={`${rewardPool} Points`} />
        </div>
      </div>

      <OpponentSection opponent={bet.opponent} isCreator={isCreator} />

      {bet.status === "resolved" && bet.winnerId && (
        <div
          className={cn(
            "flex items-center justify-center rounded-[20px] px-4 py-4",
            bet.winnerId === user._id
              ? "bg-success-light"
              : "bg-destructive/10",
          )}
        >
          <span
            className={cn(
              "text-sm font-bold",
              bet.winnerId === user._id ? "text-fg-base" : "text-destructive",
            )}
          >
            {bet.winnerId === user._id
              ? `You won ${rewardPool} pts!`
              : "You lost this bet"}
          </span>
        </div>
      )}

      <BetActions
        betId={bet._id}
        canAccept={canAccept}
        canDecline={canDecline}
        canCancel={canCancel}
        canRematch={canRematch}
      />
    </div>
  );
}
