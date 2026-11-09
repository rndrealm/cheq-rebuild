"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/components/providers/user-provider";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getLockedPoints } from "@/lib/helpers/bets";
import { formatPrice } from "@/lib/helpers/format";
import { AppRoutes } from "@/lib/routes";
import { EyeIcon, HistoryIcon, NewTradeIcon } from "@/lib/svgs";
import { cn } from "@/lib/utils";

const TILES = [
  { label: "New Trade", href: AppRoutes.createBet.path, icon: NewTradeIcon },
  { label: "Trade History", href: AppRoutes.feed.path, icon: HistoryIcon },
];

/** Home page shortcuts, with the balance and avatar underneath. */
export function TradeTiles({ className }: { className?: string }) {
  const user = useUser();
  const [hidden, setHidden] = useState(false);
  // Already subscribed by the layout, so this is instant.
  const bets = useQuery(api.bets.feedForUser, { userId: user._id });
  // Available points plus what's locked in bets.
  const total = user.points + (bets ? getLockedPoints(bets, user._id) : 0);

  return (
    <section className={cn("flex min-w-0 flex-col gap-5 pb-4", className)}>
      <div className="grid grid-cols-2 gap-2">
        {TILES.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex h-34 flex-col justify-between rounded-xl p-4 text-fg-base outline-none transition-colors hover:bg-gray-3 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Icon className="size-6 text-gray-12" />
            <span className="text-sm leading-5 font-medium tracking-[-0.0046em]">
              {label}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex w-full flex-col gap-4.75">
        <div className="flex items-center justify-between">
          <span className="text-sm leading-5 font-medium tracking-[-0.0046em] text-gray-12/55">
            Total Balance
          </span>
          <button
            type="button"
            aria-label={hidden ? "Show balance" : "Hide balance"}
            aria-pressed={hidden}
            onClick={() => setHidden((v) => !v)}
            className="flex size-5 cursor-pointer items-center justify-center rounded text-gray-12 outline-none hover:bg-gray-3 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <EyeIcon className="size-4.5" />
          </button>
        </div>

        <div className="flex items-end justify-between gap-4">
          <span className="min-w-0 truncate font-display text-2xl leading-8 font-semibold tabular-nums text-fg-base">
            {hidden ? "$******" : formatPrice(total)}
          </span>
          <Image
            src="/media/demo/kurosawa.jpg"
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-[26px] bg-[#f0f0f0] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
