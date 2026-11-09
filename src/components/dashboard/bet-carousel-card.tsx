import { BetAvatar } from "@/components/bet-avatar";
import {
  getBetDescription,
  getStatusConfig,
  type FeedBet,
} from "@/lib/helpers/bets";
import { formatPrice } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";

export const CARD_WIDTH = 317;
export const CARD_HEIGHT = 393;

function getTerms(bet: FeedBet) {
  if (bet.type === "up_down") {
    return {
      label: bet.token.symbol,
      value: bet.betTerms.direction === "up" ? "Goes Up" : "Goes Down",
    };
  }
  return getBetDescription(bet);
}

/** A bet in the Feed carousel: who, how much, and its stake details. */
export function BetCarouselCard({
  bet,
  viewerId,
}: {
  bet: FeedBet;
  viewerId: string;
}) {
  const terms = getTerms(bet);
  const status = getStatusConfig(bet.status, bet.winnerId === viewerId);
  const label = bet.status === "active" ? "Running" : status.label;

  return (
    <article
      className="flex flex-col gap-4 overflow-clip rounded-xl bg-gray-2 p-5.5 font-display"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <div className="flex flex-col gap-3">
        <BetAvatar seed={bet.creatorId} />
        <div className="flex flex-col gap-1">
          <p className="truncate text-sm leading-5 font-semibold text-fg-base">
            {bet.creator?.name ?? "Unknown"}
          </p>
          {bet.creator && (
            <p className="truncate text-xs leading-4 font-medium text-hint">
              @{bet.creator.username}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[32px] leading-10 font-semibold text-fg-base">
            {formatPrice(bet.creatorWager)}
          </p>
          <div
            className={cn(
              "relative flex shrink-0 items-center justify-center overflow-clip rounded-full border-[0.5px] border-solid px-4 py-1.75",
              status.border,
            )}
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 rounded-full bg-linear-to-b",
                status.gradient,
              )}
            />
            <span
              className={cn(
                "relative text-caption leading-4 font-semibold",
                status.text,
                status.textShadow,
              )}
            >
              {label}
            </span>
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 rounded-[inherit]",
                status.insetShadow,
              )}
            />
          </div>
        </div>
        <div className="border-t border-black/8" />
      </div>

      <div className="flex flex-col gap-4 text-caption leading-4 font-semibold text-fg-base">
        <p>Stake Details</p>
        <div className="flex flex-col gap-3">
          <Row label={terms.label} value={terms.value} />
          <Row label="Total Stake" value={`${bet.creatorWager} Points`} />
          <Row
            label="Reward Pool"
            value={`${bet.creatorWager + bet.opponentWager} Points`}
          />
        </div>
      </div>

      <p className="text-xs leading-4 font-medium text-hint">
        The point system translates 1:1 with the USD, 1 point is equal to 1 USD
      </p>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="truncate">{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}
