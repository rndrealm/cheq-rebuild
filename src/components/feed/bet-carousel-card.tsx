import { BetAvatar } from "@/components/bet-avatar";
import {
  getBetDescription,
  getStatusConfig,
  type FeedBet,
} from "@/lib/helpers/bets";
import { formatPrice } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";

export const CARD_WIDTH = 309;
export const CARD_HEIGHT = 361;

// From the Figma paints (plain CSS gradients blend in sRGB like Figma;
// Tailwind's bg-linear-* would blend in oklab). Each gradient border is a
// second background clipped to the border box under a transparent border.
// Card: fill lightens downwards; the border is light grey at the sides and
// fades to white in the middle.
const CARD_BACKGROUND =
  "linear-gradient(to bottom, #f1f1f1 -12.66%, #fff 137.03%) padding-box, " +
  "linear-gradient(to right, #f2f2f2 -1.3%, #fff 49%, #f2f2f2 84.1%) border-box";
// Live status pill: the border is green at the right, fading to grey.
const LIVE_PILL_BACKGROUND =
  "linear-gradient(#f2f2f2, #f2f2f2) padding-box, " +
  "linear-gradient(240deg, var(--price-up) -55%, #9acda6 17.5%, #f6f6f6 143%) border-box";

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
  const live = bet.status === "active";

  return (
    <article
      className="flex flex-col gap-4 overflow-clip rounded-[20px] border-2 border-transparent p-4 font-display shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background: CARD_BACKGROUND,
      }}
    >
      <div className="flex items-center gap-3">
        <BetAvatar seed={bet.creatorId} />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="truncate text-sm leading-3.5 font-medium text-fg-base">
            {bet.creator?.name ?? "Unknown"}
          </p>
          {bet.creator && (
            <p className="truncate text-caption leading-[13px] text-hint">
              @{bet.creator.username}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 py-4">
        <p className="flex items-end gap-1.75 whitespace-nowrap font-medium">
          <span className="text-[32px] leading-8 tracking-[0.02em] text-fg-base">
            {formatPrice(bet.creatorWager)}
          </span>
          <span className="text-xs leading-4.25 text-[#434343]">USD</span>
        </p>
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-clip rounded-[9px] border-[0.5px] border-solid px-2.75 py-2 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04)]",
            live ? "border-transparent" : ["bg-[#f2f2f2]", status.border],
          )}
          style={live ? { background: LIVE_PILL_BACKGROUND } : undefined}
        >
          <span className="text-caption leading-4 font-medium text-[#434343]">
            {live ? "Running" : status.label}
          </span>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_1px_-1px_2px_0px_rgba(255,255,255,0.25),inset_0px_1px_3px_0px_white]"
          />
        </div>
      </div>

      <div className="rounded-[10px] bg-[#f0f0f0] px-3 py-2.5 text-caption leading-4 font-medium text-[#434343]">
        <div className="flex h-28 flex-col gap-4">
          <p>Stake Details</p>
          <div className="flex flex-col gap-3">
            <Row label={terms.label} value={terms.value} />
            <Row label="Total Stake" value={`${bet.creatorWager} Points`} />
            <Row
              label="Reward Pool"
              value={`${bet.creatorWager + bet.opponentWager} Points`}
              className="font-semibold"
            />
          </div>
        </div>
      </div>

      <p className="text-center text-xs leading-4 text-hint">
        The point system translates 1:1 with the USD, 1 point is equal to 1
        USD. <span className="font-medium underline">Learn more</span>
      </p>
    </article>
  );
}

function Row({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="truncate">{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );
}
