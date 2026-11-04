"use client";

import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { EventFeed } from "@/components/dashboard/event-feed";
import {
  LiveBetChartPanel,
  LiveBetWidget,
  LiveBetsProvider,
} from "@/components/dashboard/live-bet-widget";
import { AppRoutes } from "@/lib/routes";

export default function Dashboard() {
  return (
    <div className="flex flex-1 bg-gray-3">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col font-display">
        {/* The title row matches the sidebar logo (py-6 + 48px tile). The
            sidebar nav's mt-22 is derived from this header and the h-9 section
            heading rows so the cards' tops line up with the Home tile; change
            them together. */}
        <header className="mb-10 w-full pt-6 pr-8 pl-4">
          <div className="flex h-12 items-center">
            <h1 className="text-base font-semibold text-fg-base">Home</h1>
          </div>
        </header>

        {/* The chart and the widget show the same selected bet. */}
        <LiveBetsProvider>
          <main className="grid w-full grid-cols-1 items-start gap-6 pr-8 pb-6 pl-4 lg:grid-cols-3">
            {/* Columns 1–2: the selected bet's chart, then the feed */}
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
              <section className="flex flex-col gap-3">
                <h2 className="flex h-9 items-center text-sm font-semibold text-fg-base">
                  Chart
                </h2>
                <LiveBetChartPanel />
              </section>

              <section className="flex min-w-0 flex-col gap-3">
                <div className="flex h-9 items-center justify-between">
                  <h2 className="text-base font-semibold text-fg-base">Feed</h2>
                  <Link
                    href={AppRoutes.feed.path}
                    className="text-caption font-semibold text-gray-11 hover:text-fg-base"
                  >
                    View all
                  </Link>
                </div>
                <EventFeed />
              </section>
            </div>

            {/* Column 3: main widget (live bets), sized to its content. Titled
                like the other sections so the cards' top edges line up. */}
            <section className="flex min-w-0 flex-col gap-3">
              <h2 className="flex h-9 items-center text-sm font-semibold text-fg-base">
                Live bets
              </h2>
              <LiveBetWidget />
            </section>
          </main>
        </LiveBetsProvider>
      </div>
    </div>
  );
}
