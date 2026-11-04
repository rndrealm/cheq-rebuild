"use client";

import { TokenCard } from "@/components/token-card";
import type { FeedBet } from "@/lib/helpers/bets";

// Horizontal, snap-scrolling row of TokenCards. The vertical padding (cancelled
// by the negative margin) keeps the cards' drop shadow from being clipped by
// the scroll container.
export function FeedCarousel({ bets }: { bets: FeedBet[] }) {
  return (
    <div className="-mx-2 -my-5 snap-x snap-mandatory scroll-px-2 overflow-x-auto px-2 py-5 [scrollbar-width:none]">
      <div className="flex w-max gap-4">
        {bets.map((bet) => (
          <div key={bet._id} className="shrink-0 snap-start">
            <TokenCard bet={bet} />
          </div>
        ))}
      </div>
    </div>
  );
}
