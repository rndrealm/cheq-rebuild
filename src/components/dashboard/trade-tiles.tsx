"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/components/providers/user-provider";
import { RemoteImage } from "@/components/ui/remote-image";
import { WipeReveal } from "@/components/ui/wipe-reveal";
import { useStoredFlag } from "@/hooks/use-stored-flag";
import { formatPrice } from "@/lib/helpers/format";
import { AppRoutes } from "@/lib/routes";
import { EyeIcon, EyeOffIcon, HistoryIcon, NewTradeIcon } from "@/lib/svgs";
import { cn } from "@/lib/utils";

const TILES = [
  { label: "New Trade", href: AppRoutes.createBet.path, icon: NewTradeIcon },
  { label: "Trade History", href: AppRoutes.feed.path, icon: HistoryIcon },
];

const AVATAR_FALLBACK = "/media/avatar.png";

/** Home page shortcuts, with the balance and avatar underneath. */
export function TradeTiles({ className }: { className?: string }) {
  const user = useUser();
  // Remembered per browser, like most finance apps.
  const [hidden, setHidden] = useStoredFlag("cheq:hide-balance");
  // Available points plus what's held in bets. Also subscribed by the layout,
  // so it's usually ready when Home mounts.
  const total = useQuery(api.bets.myBalance)?.total;

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
            onClick={() => setHidden(!hidden)}
            // The ::after widens the hit area to 32px without moving the icon.
            className="relative flex size-5 cursor-pointer items-center justify-center rounded text-gray-12 outline-none after:absolute after:-inset-1.5 hover:bg-gray-3 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {hidden ? (
              <EyeOffIcon className="size-4.5" />
            ) : (
              <EyeIcon className="size-4.5" />
            )}
          </button>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <WipeReveal
              revealed={total !== undefined}
              skeleton={<BalanceSkeleton />}
              className="bg-gray-2"
            >
              <p className="truncate font-display text-2xl leading-8 font-semibold tabular-nums text-fg-base"
              >
                {hidden ? (
                  <>
                    <span aria-hidden>$******</span>
                    <span className="sr-only">Hidden</span>
                  </>
                ) : (
                  formatPrice(total ?? 0)
                )}
              </p>
            </WipeReveal>
          </div>
          <RemoteImage
            src={user.avatarUrl}
            fallback={AVATAR_FALLBACK}
            alt=""
            size={32}
            className="shrink-0 bg-gray-4"
          />
        </div>
      </div>
    </section>
  );
}

function BalanceSkeleton() {
  return (
    <div aria-hidden className="flex h-8 items-center">
      <div className="h-6 w-32 animate-pulse rounded bg-gray-4" />
    </div>
  );
}
