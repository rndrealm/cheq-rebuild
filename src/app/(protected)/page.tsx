"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { Placeholder } from "@/components/dashboard/placeholder";
import { FeedCarousel } from "@/components/dashboard/feed-carousel";
import { LiveBetWidget } from "@/components/dashboard/live-bet-widget";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppRoutes } from "@/lib/routes";

const FEED_PREVIEW_COUNT = 10;

export default function Dashboard() {
  const feed = useQuery(api.bets.feed);

  return (
    <div className="flex flex-1 flex-col bg-[#f6f6f6]">
      <AppHeader />

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-6 px-6 py-6 lg:grid-cols-3">
        {/* Column 1: main widget (live bets), sized to its content */}
        <LiveBetWidget />

        {/* Columns 2–3 */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-bold text-fg-base">Leaderboard</h2>
            <Placeholder label="Leaderboard table" className="h-80" />
          </section>

          <section className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-fg-base">Feed</h2>
              <Link
                href={AppRoutes.feed.path}
                className="text-caption font-semibold text-fg-400 hover:text-fg-base"
              >
                View all
              </Link>
            </div>
            {feed === undefined ? (
              <Placeholder label="Loading..." className="h-100" />
            ) : feed.length === 0 ? (
              <EmptyState />
            ) : (
              <FeedCarousel bets={feed.slice(0, FEED_PREVIEW_COUNT)} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
