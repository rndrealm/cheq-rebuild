"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { GradientAvatar } from "@outpacelabs/avatars";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useUser } from "@/components/providers/user-provider";
import { useConvexMutation } from "@/hooks/use-convex-mutation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getStatusConfig,
  getBetDescription,
  type BetStatus,
} from "@/lib/helpers/bets";

const DURATION_LABELS: Record<string, string> = {
  "1h": "1 Hour",
  "4h": "4 Hours",
  "24h": "24 Hours",
  "3d": "3 Days",
  "1w": "1 Week",
};

function formatTimeLeft(ms: number): string {
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

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-fg-300">{label}</span>
      <span className={cn("text-sm font-bold text-fg-base", valueClassName)}>
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

  const { mutate: acceptBet, isPending: isAccepting } = useConvexMutation(
    api.bets.accept,
  );
  const { mutate: declineBet, isPending: isDeclining } = useConvexMutation(
    api.bets.decline,
  );
  const { mutate: cancelBet, isPending: isCancelling } = useConvexMutation(
    api.bets.cancel,
  );
  const { mutate: rematchBet, isPending: isRematching } = useConvexMutation(
    api.bets.rematch,
  );

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
  const canCancel = isCreator && (bet.status === "pending" || bet.status === "countered");
  const canRematch =
    (isCreator || isOpponent) &&
    (bet.status === "resolved" || bet.status === "tied");

  const isWinner =
    bet.status === "resolved" && bet.winnerId
      ? bet.winnerId === user._id
      : null;

  const statusConfig = getStatusConfig(bet.status as BetStatus, isWinner);
  const description = getBetDescription(bet as any);
  const rewardPool = bet.creatorWager + bet.opponentWager;
  const now = Date.now();
  const timeLeftMs =
    bet.status === "active" ? bet.resolvesAt - now : bet.expiresAt - now;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-8 items-center justify-center rounded-lg bg-bg-200 text-fg-400 transition-colors hover:bg-bg-300"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-h2 font-bold text-fg-base">Bet Details</h1>
      </div>

      {/* Creator Card */}
      <div className="flex flex-col items-center gap-3 rounded-[20px] border border-border bg-card px-4 py-6">
        <GradientAvatar seed={bet.creator?.name ?? "Unknown"} size={48} />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-bold text-fg-base">
            {bet.creator?.name ?? "Unknown"}
          </span>
          {bet.creator?.username && (
            <span className="text-xs font-semibold text-fg-300">
              @{bet.creator.username}
            </span>
          )}
        </div>
        <span
          className={cn(
            "flex h-6 items-center justify-center rounded-full px-3 text-xs font-semibold",
            statusConfig.bg,
            statusConfig.text,
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Bet Info */}
      <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-fg-300">
          Position
        </p>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-fg-base">
            {description.label}
          </span>
          <span className="text-base font-extrabold text-fg-base">
            {description.value}
          </span>
        </div>
        <div className="border-t border-border" />
        <InfoRow
          label="Token"
          value={`${bet.token.symbol} — $${bet.priceAtCreation.toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
        />
        {bet.tokenB && (
          <InfoRow
            label="vs Token"
            value={`${bet.tokenB.symbol}${bet.priceAtCreationB ? ` — $${bet.priceAtCreationB.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : ""}`}
          />
        )}
        <InfoRow
          label="Timeframe"
          value={DURATION_LABELS[bet.duration] ?? bet.duration}
        />
        {(bet.status === "pending" ||
          bet.status === "countered" ||
          bet.status === "active") && (
          <InfoRow
            label={bet.status === "active" ? "Resolves in" : "Expires in"}
            value={formatTimeLeft(timeLeftMs)}
            valueClassName={
              timeLeftMs < 60 * 60 * 1000 ? "text-warning" : undefined
            }
          />
        )}
      </div>

      {/* Wager Info */}
      <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-fg-300">
          Stakes
        </p>
        <InfoRow label="Creator Wager" value={`${bet.creatorWager} pts`} />
        <InfoRow label="Opponent Wager" value={`${bet.opponentWager} pts`} />
        <div className="border-t border-dashed border-border" />
        <InfoRow
          label="Reward Pool"
          value={`${rewardPool} pts`}
          valueClassName="text-success"
        />
      </div>

      {/* Opponent Section */}
      {bet.opponent ? (
        <div className="flex items-center gap-3 rounded-[20px] border border-border bg-card px-4 py-4">
          <GradientAvatar seed={bet.opponent.name} size={32} />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-fg-base">
              {bet.opponent.name}
            </span>
            <span className="text-xs font-semibold text-fg-300">
              @{bet.opponent.username}
            </span>
          </div>
          <span className="ml-auto text-xs font-semibold text-fg-400">
            Opponent
          </span>
        </div>
      ) : isCreator ? (
        <div className="flex items-center justify-center rounded-[20px] border border-dashed border-border px-4 py-4">
          <span className="text-sm font-semibold text-fg-300">
            Waiting for an opponent...
          </span>
        </div>
      ) : null}

      {/* Winner Banner */}
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

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {canAccept && (
          <Button
            size="lg"
            loading={isAccepting}
            className="rounded-[10px]"
            onClick={() =>
              acceptBet({ betId: bet._id, userId: user._id })
            }
          >
            Accept Challenge
          </Button>
        )}
        {canAccept && (
          <Button
            variant="outline"
            size="lg"
            loading={isDeclining}
            className="rounded-[10px]"
            onClick={() =>
              declineBet({ betId: bet._id, userId: user._id })
            }
          >
            Decline
          </Button>
        )}
        {canCancel && (
          <Button
            variant="destructive"
            size="lg"
            loading={isCancelling}
            className="rounded-[10px]"
            onClick={() =>
              cancelBet({ betId: bet._id, userId: user._id })
            }
          >
            Cancel Bet
          </Button>
        )}
        {canRematch && (
          <Button
            variant="secondary"
            size="lg"
            loading={isRematching}
            className="rounded-[10px]"
            onClick={async () => {
              const newBetId = await rematchBet({
                betId: bet._id,
                userId: user._id,
              });
              if (newBetId) router.push(`/bet/${newBetId}`);
            }}
          >
            Rematch
          </Button>
        )}
      </div>
    </div>
  );
}
