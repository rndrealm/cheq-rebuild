"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { TokenCard } from "@/components/token-card";
import { EmptyState } from "@/components/empty-state";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function FeedPage() {
  const feed = useQuery(api.bets.feed);

  return (
    <div className="flex flex-1 bg-gray-3">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex flex-1 flex-col gap-6 px-6 py-6">
          {/* Columns match the TokenCard width so the heading lines up with the
              outer card edges and the whole block stays centered. */}
          <div className="grid grid-cols-[repeat(auto-fill,--spacing(79.25))] justify-center gap-4">
            <h1 className="col-span-full mb-2 text-h2 font-bold text-fg-base">
              Feed
            </h1>

            {feed?.map((bet) => (
              <TokenCard key={bet._id} bet={bet} />
            ))}
          </div>

          {feed === undefined ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-caption text-fg-300">Loading...</p>
            </div>
          ) : feed.length === 0 ? (
            <EmptyState />
          ) : null}
        </main>
      </div>
    </div>
  );
}
