import Link from "next/link";
import { GradientAvatar } from "@outpacelabs/avatars";
import {
  getStatusConfig,
  getBetDescription,
  type FeedBet,
} from "@/lib/helpers/bets";
import { cn } from "@/lib/utils";
import { AppRoutes } from "@/lib/routes";
import { ChartToggleIcon } from "@/components/chart-toggle-icon";

type BetCardProps = {
  bet: FeedBet;
  onToggle?: () => void;
};

export function BetCard({ bet, onToggle }: BetCardProps) {
  const creatorName = bet.creator?.name ?? "Unknown";
  const creatorUsername = bet.creator?.username;

  const statusConfig = getStatusConfig(bet.status, null);
  const description = getBetDescription(bet);
  const rewardPool = bet.creatorWager + bet.opponentWager;


  return (
    <Link
      href={AppRoutes.betDetail.path(bet._id)}
      className="flex w-79.25 flex-col overflow-clip rounded-[20px] border border-border bg-card px-5.5 pb-7 pt-5.5"
    >
      {/* Avatar + Name + Toggle */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <GradientAvatar seed={creatorName} size={48} />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold leading-5 text-fg-base">
              {creatorName}
            </span>
            {creatorUsername && (
              <span className="text-xs font-medium leading-4 text-fg-300">
                @{creatorUsername}
              </span>
            )}
          </div>
        </div>
        <ChartToggleIcon
          layoutId={onToggle ? `chart-toggle-${bet._id}` : undefined}
          onClick={
            onToggle
              ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle();
                }
              : undefined
          }
        />
      </div>

      {/* Wager + Status */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[32px] font-semibold leading-10 text-fg-base">
          ${bet.creatorWager}
        </span>
        <div
          className={cn(
            "relative flex items-center justify-center overflow-clip rounded-full border-[0.5px] border-solid px-4 py-1.75",
            statusConfig.border,
          )}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full bg-linear-to-b",
              statusConfig.gradient,
            )}
          />
          <span
            className={cn(
              "relative text-caption! font-semibold! leading-4",
              statusConfig.text,
              statusConfig.textShadow,
            )}
          >
            {statusConfig.label}
          </span>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-[inherit]",
              statusConfig.insetShadow,
            )}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="my-4.5 w-full border-t border-border" />

      {/* Stake Details */}
      <div className="flex flex-col gap-4">
        <span className="text-caption font-semibold leading-4 text-fg-base">
          Stake Details
        </span>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold leading-4 text-fg-base">
              {description.label}
            </span>
            <span className="text-caption font-semibold leading-4 text-fg-base">
              {description.value}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold leading-4 text-fg-base">
              Total Stake
            </span>
            <span className="text-caption font-semibold leading-4 text-fg-base">
              {bet.creatorWager} Points
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-caption font-semibold leading-4 text-fg-base">
              Reward Pool
            </span>
            <span className="text-caption font-semibold leading-4 text-fg-base">
              {rewardPool} Points
            </span>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs font-medium leading-4 text-fg-300">
        The point system translates 1:1 with the USD, 1 point is equal to 1 USD
      </p>
    </Link>
  );
}
