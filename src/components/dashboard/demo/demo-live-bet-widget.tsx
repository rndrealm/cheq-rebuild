"use client";

// DEMO COPY of the dashboard live bet widget (../live-bet-widget.tsx), fed by
// the simulated market in ./live-bet-sim.ts instead of Convex + Binance. Kept
// separate on purpose: iterate on the UI here, then port what works back.
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../../convex/_generated/api";
import { Avatar } from "@/components/avatar";
import { RemoteImage } from "@/components/ui/remote-image";
import { Placeholder } from "@/components/dashboard/placeholder";
import { EXPRESSIONS, COLORS } from "@/lib/avatar-shapes";
import { getTokenImage, getTokenName } from "@/lib/constants/tokens";
import {
  formatCountdown,
  getPositions,
  getStatusConfig,
} from "@/lib/helpers/bets";
import {
  distanceToTarget,
  getBetWindow,
  getStanding,
  getStartPrices,
  percentChange,
  type Standing,
} from "@/lib/helpers/bet-progress";
import { formatPrice } from "@/lib/helpers/format";
import type { BetSeries, ChartPoint } from "@/hooks/use-bet-chart";
import {
  DemoBetChart as BetChart,
  type ChartMarker,
  type ReferenceLine,
} from "./demo-bet-chart";
import {
  describeEvent,
  formatTimeAgo,
  type EventTone,
} from "@/lib/helpers/bet-events";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { AppRoutes } from "@/lib/routes";
import { ChevronDownIcon } from "@/lib/svgs";
import mainAssets from "@/lib/assets";
import { cn, simpleHash } from "@/lib/utils";

export type LiveBet = FunctionReturnType<typeof api.bets.myActive>[number];
export type BetEvent = Doc<"betEvents">;
export type BetChartData = { a: BetSeries | null; b: BetSeries | null };

const CARD_CLASS =
  "relative w-full overflow-hidden rounded-[20px] border border-border bg-card";
const CARD_SHADOW = { boxShadow: "0px 4px 20px 0px #00000014" };

// Shared between the chart markers and the update cards: hovering either
// highlights the matching one.
type Highlight = {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
};

// The current simulation snapshot, read by the card and chart.
type DemoData = {
  events: Record<string, BetEvent[]>;
  charts: Record<string, BetChartData>;
};

const DemoDataContext = createContext<DemoData>({ events: {}, charts: {} });

export function DemoLiveBetWidget({
  bets,
  viewerId,
  events,
  charts,
}: {
  bets: LiveBet[] | undefined;
  viewerId: Id<"users">;
  events: DemoData["events"];
  charts: DemoData["charts"];
}) {
  return (
    <DemoDataContext value={{ events, charts }}>
      <WidgetBody bets={bets} viewerId={viewerId} />
    </DemoDataContext>
  );
}

function WidgetBody({
  bets,
  viewerId,
}: {
  bets: LiveBet[] | undefined;
  viewerId: Id<"users">;
}) {
  const demo = useContext(DemoDataContext);
  const [index, setIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Bets resolve while the widget is open, so wrap rather than trust the index.
  const current = bets && bets.length > 0 ? index % bets.length : 0;
  const bet = bets?.[current];
  const events = bet ? demo.events[bet._id] : undefined;

  if (bets === undefined) return <Placeholder label="" className="h-120" />;
  if (!bet) return <EmptyWidget />;

  const highlight: Highlight = { activeId, setActiveId };

  return (
    <div className={CARD_CLASS} style={CARD_SHADOW}>
      {bets.length > 1 && (
        <button
          type="button"
          onClick={() => {
            setIndex(current + 1);
            setActiveId(null);
          }}
          aria-label={`Show next bet (${current + 1} of ${bets.length})`}
          className="absolute top-5.5 right-5.5 z-10 flex h-8 cursor-pointer items-center gap-0.5 rounded-full bg-bg-300 pr-1.5 pl-3 text-xs font-semibold tabular-nums text-fg-base transition-colors hover:bg-bg-400"
        >
          {current + 1} / {bets.length}
          <ChevronDownIcon className="size-5 -rotate-90" />
        </button>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={bet._id}
          initial={{ opacity: 0, y: 12, scale: 0.98, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, scale: 0.98, filter: "blur(4px)" }}
          transition={{ duration: 0.2 }}
        >
          <LiveBetCard
            bet={bet}
            viewerId={viewerId}
            events={events ?? []}
            highlight={highlight}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const VISIBLE_UPDATES = 3;

const TONE_COLOR: Record<EventTone, string> = {
  good: "#47a95e",
  bad: "#e4813f",
  neutral: "#A6A6A6",
};

function rivalName(bet: LiveBet): string {
  return bet.rival ? `@${bet.rival.username}` : "Your rival";
}

function BetUpdates({
  bet,
  events,
  highlight,
}: {
  bet: LiveBet;
  events: BetEvent[];
  highlight: Highlight;
}) {
  const [expanded, setExpanded] = useState(false);
  if (events.length === 0) return null;

  const visible = expanded ? events : events.slice(0, VISIBLE_UPDATES);
  const hidden = events.length - VISIBLE_UPDATES;

  return (
    <div className="mt-5 flex flex-col gap-2">
      <span className="text-caption font-semibold leading-4 text-fg-base">
        Updates
      </span>
      <AnimatePresence initial={false}>
        {visible.map((event) => {
          const copy = describeEvent(event, bet, bet.isCreator, rivalName(bet));
          const active = highlight.activeId === event._id;
          return (
            <motion.div
              key={event._id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              onMouseEnter={() => highlight.setActiveId(event._id)}
              onMouseLeave={() => highlight.setActiveId(null)}
              className={cn(
                "flex items-start gap-3 rounded-xl bg-bg-200 p-3 transition-shadow",
                active && "ring-2 ring-fg-base/10",
              )}
            >
              <span
                aria-hidden
                className="mt-1.5 size-2 shrink-0 rounded-full"
                style={{ backgroundColor: TONE_COLOR[copy.tone] }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-caption font-semibold leading-5 text-fg-base">
                    {copy.title}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-fg-300">
                    <TimeAgo at={event.at} />
                  </span>
                </div>
                <span className="text-xs leading-4 text-fg-400">{copy.body}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer self-start px-1 text-xs font-semibold text-fg-400 hover:text-fg-base"
        >
          {expanded ? "Show less" : `Show ${hidden} earlier`}
        </button>
      )}
    </div>
  );
}

// Re-renders itself every 30s so "2m ago" stays current.
function TimeAgo({ at }: { at: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return <>{formatTimeAgo(now - at)}</>;
}

function LiveBetCard({
  bet,
  viewerId,
  events,
  highlight,
}: {
  bet: LiveBet;
  viewerId: Id<"users">;
  events: BetEvent[];
  highlight: Highlight;
}) {
  const positions = getPositions(bet, bet.isCreator);
  const myWager = bet.isCreator ? bet.creatorWager : bet.opponentWager;
  const pool = bet.creatorWager + bet.opponentWager;
  const pair = bet.tokenB
    ? `${bet.token.symbol} vs ${bet.tokenB.symbol}`
    : `${bet.token.symbol} / USDT`;

  return (
    <div className="flex flex-col p-5.5">
      {/* Token */}
      <div className="flex items-center gap-3">
        <div className="flex -space-x-3">
          <RemoteImage
            src={getTokenImage(bet.token.symbol)}
            alt={bet.token.symbol}
            size={40}
            fallback={mainAssets.baseImage}
          />
          {bet.tokenB && (
            <RemoteImage
              src={getTokenImage(bet.tokenB.symbol)}
              alt={bet.tokenB.symbol}
              size={40}
              fallback={mainAssets.baseImage}
              className="ring-2 ring-card"
            />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold leading-5 text-fg-base">
            {pair}
          </span>
          {!bet.tokenB && (
            <span className="text-xs font-medium leading-4 text-fg-300">
              {getTokenName(bet.token.symbol)}
            </span>
          )}
        </div>
      </div>

      {/* Matchup */}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <Player
          id={viewerId}
          name="You"
          position={positions.mine}
          align="start"
        />
        <span className="pt-3 text-caption font-semibold text-fg-300">vs</span>
        <Player
          id={bet.rival?.id}
          name={bet.rival ? `@${bet.rival.username}` : "Unknown"}
          position={positions.theirs}
          align="end"
        />
      </div>

      <BetProgress bet={bet} events={events} highlight={highlight} />

      {/* The card is keyed by bet, so flipping shows that bet's updates
          without animating them all in; only updates that arrive while
          watching slide in. */}
      <BetUpdates bet={bet} events={events} highlight={highlight} />

      <div className="my-4.5 w-full border-t border-border" />

      {/* Stake details */}
      <div className="flex flex-col gap-4">
        <span className="text-caption font-semibold leading-4 text-fg-base">
          Stake Details
        </span>
        <div className="flex flex-col gap-3">
          <Row label="Your stake" value={`${myWager} Points`} />
          <Row label="Reward pool" value={`${pool} Points`} />
          <Row label="Ends in" value={<Countdown to={bet.resolvesAt} />} />
        </div>
      </div>

      <Link
        href={AppRoutes.betDetail.path(bet._id)}
        className="mt-5 self-start text-xs font-semibold text-fg-400 hover:text-fg-base"
      >
        View bet
      </Link>
    </div>
  );
}

const COLOR_UP = "#47a95e";
const COLOR_DOWN = "#e4813f";
const COLOR_EVEN = "#A6A6A6";
const COLOR_RIVAL_LINE = "#D1D1D1";

const STANDING_COLOR: Record<Standing, string> = {
  winning: COLOR_UP,
  losing: COLOR_DOWN,
  even: COLOR_EVEN,
};

/** Live price, % move, standing and the chart over the bet's window. */
function BetProgress({
  bet,
  events,
  highlight,
}: {
  bet: LiveBet;
  events: BetEvent[];
  highlight: Highlight;
}) {
  const betWindow = getBetWindow(bet);
  const startPrices = getStartPrices(bet);
  const isVs = bet.type === "token_vs_token" && !!bet.tokenB;

  const data = useContext(DemoDataContext).charts[bet._id] ?? null;

  if (data === null) {
    return <Placeholder label="" className="mt-5 h-62 rounded-2xl" />;
  }
  if (!data.a || (isVs && !data.b)) {
    return (
      <div className="mt-5 flex h-62 items-center justify-center rounded-2xl bg-bg-200">
        <span className="text-caption text-fg-300">Price data unavailable</span>
      </div>
    );
  }

  const latestA = data.a.latest;
  const latestB = data.b?.latest;
  const standing = getStanding(bet, bet.isCreator, latestA, latestB);
  const changeA = percentChange(startPrices.a, latestA);

  // Checkpoints as markers on the line, coloured from the viewer's side.
  const toMarker = (event: BetEvent, v: number): ChartMarker => {
    const copy = describeEvent(event, bet, bet.isCreator, rivalName(bet));
    return {
      id: event._id,
      t: event.at,
      v,
      color: TONE_COLOR[copy.tone],
      label: copy.title,
      active: highlight.activeId === event._id,
    };
  };

  if (isVs && data.b && bet.tokenB && startPrices.b !== undefined) {
    // Race: both lines as % change from their own start, so they share a
    // scale. The viewer's pick is coloured by standing, the rival's is grey.
    const changeB = percentChange(startPrices.b, data.b.latest);
    const creatorPicksA = bet.betTerms.creatorSide === "tokenA";
    const mineIsA = creatorPicksA === bet.isCreator;
    const toPct = (points: ChartPoint[], from: number) =>
      points.map((p) => ({ t: p.t, v: percentChange(from, p.v) }));
    const lineA = toPct(data.a.points, startPrices.a);
    const lineB = toPct(data.b.points, startPrices.b);
    const legs = [
      { symbol: bet.token.symbol, change: changeA, mine: mineIsA },
      { symbol: bet.tokenB.symbol, change: changeB, mine: !mineIsA },
    ];
    // Markers sit on the viewer's pick's line.
    const startB = startPrices.b;
    const markers = events.flatMap((event) => {
      if (mineIsA) return [toMarker(event, percentChange(startPrices.a, event.price))];
      if (event.priceB === undefined) return [];
      return [toMarker(event, percentChange(startB, event.priceB))];
    });

    return (
      <>
        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            {legs.map((leg) => (
              <div key={leg.symbol} className="flex items-baseline gap-2">
                <span className="w-12 text-sm font-semibold text-fg-base">
                  {leg.symbol}
                </span>
                <ChangeText value={leg.change} className="text-xl leading-7" />
                {leg.mine && (
                  <span className="text-xs font-medium text-fg-300">
                    your pick
                  </span>
                )}
              </div>
            ))}
          </div>
          <StandingPill standing={standing} />
        </div>
        <div className="mt-4">
          <BetChart
            start={betWindow.start}
            end={betWindow.end}
            references={[{ value: 0, label: "Start" }]}
            lines={[
              {
                points: mineIsA ? lineB : lineA,
                color: COLOR_RIVAL_LINE,
              },
              {
                points: mineIsA ? lineA : lineB,
                color: STANDING_COLOR[standing],
              },
            ]}
            markers={markers}
            onMarkerHover={highlight.setActiveId}
          />
        </div>
      </>
    );
  }

  const references: ReferenceLine[] = [
    { value: startPrices.a, label: `Start ${formatPrice(startPrices.a)}` },
  ];
  const target = bet.betTerms.targetPrice;
  if (bet.type === "hit_price" && target !== undefined) {
    references.push({
      value: target,
      label: `Target ${formatPrice(target)}`,
      strong: true,
    });
  }
  const distance =
    bet.type === "hit_price" ? distanceToTarget(bet, latestA) : null;

  return (
    <>
      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[32px] font-semibold leading-10 tabular-nums text-fg-base">
            {formatPrice(latestA)}
          </span>
          <span className="flex items-baseline gap-1.5">
            <ChangeText value={changeA} className="text-sm leading-5" />
            <span className="text-xs font-medium text-fg-300">
              since start
            </span>
          </span>
          {distance !== null && (
            <span className="text-xs font-medium text-fg-400">
              {distance === 0
                ? "Target reached"
                : `${distance.toFixed(2)}% to target`}
            </span>
          )}
        </div>
        <StandingPill standing={standing} />
      </div>
      <div className="mt-4">
        <BetChart
          start={betWindow.start}
          end={betWindow.end}
          references={references}
          lines={[{ points: data.a.points, color: STANDING_COLOR[standing] }]}
          markers={events.map((event) => toMarker(event, event.price))}
          onMarkerHover={highlight.setActiveId}
        />
      </div>
    </>
  );
}

function ChangeText({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        value >= 0 ? "text-[#47a95e]" : "text-destructive",
        className,
      )}
    >
      {value >= 0 ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

// Same pill as the TokenCard's status, with the live standing as its label.
function StandingPill({ standing }: { standing: Standing }) {
  const config =
    standing === "even"
      ? getStatusConfig("tied", null)
      : getStatusConfig("resolved", standing === "winning");
  const label =
    standing === "winning" ? "Winning" : standing === "losing" ? "Losing" : "Even";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-clip rounded-full border-[0.5px] border-solid px-4 py-1.75",
        config.border,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full bg-linear-to-b",
          config.gradient,
        )}
      />
      <span
        className={cn(
          "relative text-caption! font-semibold! leading-4",
          config.text,
          config.textShadow,
        )}
      >
        {label}
      </span>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          config.insetShadow,
        )}
      />
    </div>
  );
}

function Player({
  id,
  name,
  position,
  align,
}: {
  id: string | undefined;
  name: string;
  position: string;
  align: "start" | "end";
}) {
  const seed = id ?? "unknown";
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2",
        align === "start" ? "items-start" : "items-end text-right",
      )}
    >
      <Avatar
        expressionIndex={simpleHash(seed) % EXPRESSIONS.length}
        colorIndex={simpleHash(seed + "c") % COLORS.length}
        size={40}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold leading-5 text-fg-base">
          {name}
        </span>
        <span className="text-xs font-medium leading-4 text-fg-400">
          {position}
        </span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-caption font-semibold leading-4 text-fg-base">
        {label}
      </span>
      <span className="text-caption font-semibold leading-4 tabular-nums text-fg-base">
        {value}
      </span>
    </div>
  );
}

// Ticks every second on its own so the rest of the card doesn't re-render.
function Countdown({ to }: { to: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <>{formatCountdown(to - now)}</>;
}

function EmptyWidget() {
  return (
    <div
      className={cn(
        CARD_CLASS,
        "flex h-60 flex-col items-center justify-center gap-1 px-6 text-center",
      )}
      style={CARD_SHADOW}
    >
      <p className="text-sm font-semibold text-fg-base">No live bets</p>
      <p className="text-caption text-fg-300">
        Bets you&apos;re in will show up here.
      </p>
    </div>
  );
}
