"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { BetCarousel } from "@/components/dashboard/bet-carousel";
import { CARD_HEIGHT, CARD_WIDTH } from "@/components/dashboard/bet-carousel-card";
import {
  HeaderTransition,
  PageTransition,
} from "@/components/dashboard/page-transition";
import { EmptyState } from "@/components/empty-state";
import { useUser } from "@/components/providers/user-provider";
import { AppRoutes } from "@/lib/routes";
import { ChevronLeftIcon, FilterIcon } from "@/lib/svgs";

export default function FeedPage() {
  const user = useUser();
  const bets = useQuery(api.bets.feedForUser, { userId: user._id });
  const reducedMotion = useReducedMotion();

  const totalStake = bets?.reduce(
    (sum, bet) =>
      sum + (bet.creatorId === user._id ? bet.creatorWager : bet.opponentWager),
    0,
  );

  return (
    // No wrapping element: ViewTransition only animates entering and leaving
    // when nothing sits above it in the page, so the padding is in the layout.
    <>
      <HeaderTransition>
        {/* Same 24px line as Home's header, so the two line up when they swap. */}
        <header className="flex h-6 items-center justify-between">
          <Link
            href={AppRoutes.home.path}
            aria-label="Back to home"
            className="flex size-8 items-center justify-center rounded-lg text-fg-base outline-none transition-colors hover:bg-gray-3 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronLeftIcon className="size-4.5" />
          </Link>

          {/* Filtering isn't built yet. */}
          <button
            type="button"
            className="flex h-6 cursor-pointer items-center gap-3 text-base leading-6 font-medium tracking-[-0.024em] text-gray-12/55"
          >
            <FilterIcon className="size-4.5 text-gray-12" />
            Filter
          </button>
        </header>
      </HeaderTransition>

      {/* mt-25.25 leaves room for the page switch button, in the layout. */}
      <PageTransition page="feed" className="mt-25.25 flex flex-1 flex-col">
        <main className="flex flex-1 flex-col">
          {bets === undefined ? (
            <div
              className="mx-auto animate-pulse rounded-xl bg-gray-3"
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            />
          ) : bets.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <BetCarousel bets={bets} viewerId={user._id} />

              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut", delay: 0.155 }}
                className="mx-auto mt-4 flex w-79.25 max-w-full flex-col items-center font-display"
              >
                {/* Inactive for now. */}
                <button
                  type="button"
                  className="flex h-13.5 w-full cursor-pointer items-center justify-center rounded-full bg-[#0b0b0b] text-sm leading-4 font-semibold text-white shadow-[inset_0px_2px_4px_0px_#0b0b0b,inset_0px_2.5px_0px_0px_rgba(255,255,255,0.7)]"
                >
                  Open New Position
                </button>

                <p className="mt-6 text-center text-xs leading-4 font-medium text-hint">
                  Cheq is not in direct control of any tokens or memecoins in the
                  market.
                </p>

                <div className="mt-8 flex min-w-25.25 flex-col items-center gap-2.5">
                  <div className="flex w-full items-center justify-center rounded-[10px] bg-gray-2 px-2.5 py-1 text-2xl leading-10 font-semibold tabular-nums text-fg-base shadow-[inset_0px_0px_2px_0px_rgba(0,0,0,0.16),inset_0px_1px_2px_0px_rgba(0,0,0,0.08)]">
                    ${(totalStake ?? 0).toLocaleString()}
                  </div>
                  <p className="text-sm leading-5 font-medium tracking-[-0.0046em] text-fg-base">
                    Total Stake
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </main>
      </PageTransition>
    </>
  );
}
