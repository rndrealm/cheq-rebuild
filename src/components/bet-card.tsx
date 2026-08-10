import Link from "next/link";
import { GradientAvatar } from "@outpacelabs/avatars";
import {
  getStatusConfig,
  getBetDescription,
  type FeedBet,
} from "@/lib/helpers/bets";
import { cn } from "@/lib/utils";
import { AppRoutes } from "@/lib/routes";

export function BetCard({ bet }: { bet: FeedBet }) {
  const creatorName = bet.creator?.name ?? "Unknown";
  const creatorUsername = bet.creator?.username;

  const statusConfig = getStatusConfig(bet.status, null);
  const description = getBetDescription(bet);
  const rewardPool = bet.creatorWager + bet.opponentWager;

  return (
    <Link
      href={AppRoutes.betDetail.path(bet._id)}
      className="flex w-52 flex-col items-center overflow-clip rounded-[20px] border border-border bg-card px-1.5 pb-5 pt-5.75 transition-colors hover:bg-bg-200"
    >
      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-2">
        <GradientAvatar seed={creatorName} size={32} />
        <div className="flex flex-col items-center leading-4 tracking-[-0.096px]">
          <span className="text-xs font-bold text-fg-base">{creatorName}</span>
          {creatorUsername && (
            <span className="text-xs font-semibold text-fg-300">
              @{creatorUsername}
            </span>
          )}
        </div>
      </div>

      {/* Wager + Status */}
      <div className="mt-4 flex flex-col items-center gap-2.5">
        <span className="text-xl font-extrabold leading-5 tracking-[-0.16px] text-fg-base">
          {bet.creatorWager} pts
        </span>
        <span
          className={cn(
            "flex h-6 items-center justify-center rounded-full px-2 text-xs font-semibold leading-4 tracking-[-0.096px]",
            statusConfig.bg,
            statusConfig.text,
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Divider */}
      <div className="my-4 w-full border-t border-border" />

      {/* Bet Terms */}
      <p className="text-xs font-bold leading-5 tracking-[-0.096px]">
        <span className="text-fg-300">{description.label} </span>
        <span className="text-fg-base">{description.value}</span>
      </p>

      {/* Divider */}
      <div className="my-3 w-full border-t border-border" />

      {/* Reward Pool */}
      <div className="flex items-center gap-2 text-xs font-bold leading-4 tracking-[-0.096px]">
        <span className="text-fg-300">Reward Pool</span>
        <span className="text-fg-base">{rewardPool} pts</span>
      </div>
    </Link>
  );
}
