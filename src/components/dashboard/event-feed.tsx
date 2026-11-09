"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Placeholder } from "@/components/dashboard/placeholder";
import { describeFeedEvent, formatTimeAgo } from "@/lib/helpers/bet-events";
import { useTokenChart } from "@/hooks/use-token-chart";
import { AppRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const CARD_CLASS =
  "w-full overflow-hidden rounded-[20px] border border-border bg-card";
const CARD_SHADOW = { boxShadow: "0px 4px 20px 0px #00000014" };


/**
 * Dashboard feed: the latest checkpoints across all bets, as one line of text
 * each (what happened on the chart, and when) with the token's day sparkline
 * on the right.
 */
export function EventFeed() {
  const rows = useQuery(api.checkpoints.recentFeed);
  const now = useNow();

  if (rows === undefined) return <Placeholder label="" className="h-80" />;
  if (rows.length === 0) {
    return (
      <div
        className={cn(CARD_CLASS, "flex h-40 items-center justify-center")}
        style={CARD_SHADOW}
      >
        <p className="text-sm font-medium text-gray-11">
          No activity yet. Updates from live bets show up here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(CARD_CLASS, "p-2")} style={CARD_SHADOW}>
      <ul className="flex flex-col">
        {rows.map(({ event, bet, creator, opponent }) => {
          const copy = describeFeedEvent(event, bet, creator, opponent);
          return (
            <li key={event._id}>
              <Link
                href={AppRoutes.betDetail.path(bet._id)}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-gray-2"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium leading-5 text-fg-base">
                    {copy.title}
                  </span>
                  <span className="truncate text-caption leading-4 text-gray-11">
                    {copy.body}
                  </span>
                </div>
                <span className="text-xs font-medium tabular-nums text-gray-11">
                  {formatTimeAgo(now - event.at)}
                </span>
                <Sparkline symbol={bet.token.symbol} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// The token's last day, coloured by whether it's up or down over it.
function Sparkline({ symbol }: { symbol: string }) {
  const { data, fetchInterval } = useTokenChart(symbol);
  useEffect(() => {
    fetchInterval("1D");
  }, [fetchInterval]);

  const chart = data["1D"];
  if (!chart) {
    return <div aria-hidden className="h-8 w-24 rounded-md bg-gray-2" />;
  }

  const up = chart.latestPrice >= chart.basePrice;
  return (
    <svg
      aria-hidden
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className="h-8 w-24 overflow-visible"
    >
      <path
        d={chart.path}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: up ? "var(--price-up)" : "var(--price-down)" }}
      />
    </svg>
  );
}

// Ticks every 30s so "2m ago" stays current.
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
