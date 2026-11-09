"use client";

import { useState } from "react";
import { CreateBetForm } from "@/components/create-bet-form";
import { MarketMove } from "@/components/dashboard/market-move";
import {
  HeaderTransition,
  PageTransition,
} from "@/components/dashboard/page-transition";
import { RewardsCard } from "@/components/dashboard/rewards-card";
import { TokenChartPanel } from "@/components/dashboard/token-chart-panel";
import { TradeTiles } from "@/components/dashboard/trade-tiles";
import { UpdatesTable } from "@/components/dashboard/updates-table";
import { useUser } from "@/components/providers/user-provider";

const DEFAULT_TOKEN = "BTC";

export default function Dashboard() {
  const user = useUser();
  // The token picked in the bet form is the one shown on the chart.
  const [symbol, setSymbol] = useState(DEFAULT_TOKEN);

  return (
    // No wrapping element: ViewTransition only animates entering and leaving
    // when nothing sits above it in the page, so the padding is in the layout.
    <>
      <HeaderTransition>
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-base font-medium leading-6 tracking-[-0.024em] text-fg-base">
            Hey {user.name}.
          </h1>
          <MarketMove />
        </header>
      </HeaderTransition>

      {/* Room for the page switch button, which lives in the layout. */}
      <div aria-hidden className="mt-3.25 mb-1 h-9" />

      <PageTransition page="home" className="flex flex-1 flex-col">
        <main className="flex flex-1 flex-col gap-2 rounded-2xl bg-gray-2 p-2 lg:min-h-189.5 lg:flex-row">
          {/* Left: chart, then updates */}
          <div className="flex min-w-0 flex-1 flex-col gap-4.5">
            <TokenChartPanel key={symbol} symbol={symbol} />
            <div className="flex min-h-73 flex-1 flex-col gap-2 md:flex-row">
              <UpdatesTable className="flex-[537_1_0%]" />
              <TradeTiles className="flex-[414_1_0%] md:mt-12.5" />
            </div>
          </div>

          {/* Right: bet form, then rewards */}
          <div className="flex w-full shrink-0 flex-col gap-2 lg:w-84.25">
            <CreateBetForm
              variant="panel"
              defaultToken={DEFAULT_TOKEN}
              onTokenChange={setSymbol}
              className="min-h-147.75 flex-1"
            />
            <RewardsCard />
          </div>
        </main>
      </PageTransition>
    </>
  );
}
