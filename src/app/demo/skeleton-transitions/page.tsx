"use client";

import { motion, AnimatePresence } from "motion/react";
import { startTransition, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WipeReveal } from "@/components/ui/wipe-reveal";
import { getTokenName } from "@/lib/constants/tokens";

const MASK_WIPE_STYLES = `
  @property --wipe {
    syntax: '<percentage>';
    inherits: true;
    initial-value: 0%;
  }
  .mask-wipe-overlay {
    --wipe: 0%;
    mask-image: linear-gradient(to right, black var(--wipe), transparent calc(var(--wipe) + 100%));
    -webkit-mask-image: linear-gradient(to right, black var(--wipe), transparent calc(var(--wipe) + 100%));
    transition: --wipe 0.6s ease-in-out;
  }
  .mask-wipe-overlay[data-revealed="true"] {
    --wipe: -100%;
  }
  .mask-wipe-overlay[data-revealed="false"] {
    --wipe: 100%;
  }
`;

const LOAD_DELAY = 2000;
const VISIBLE_ROWS = 5;

const MOCK_TOKENS = [
  { symbol: "ETH", price: 3245.67, change: 2.4 },
  { symbol: "SOL", price: 178.32, change: -1.8 },
  { symbol: "RENDER", price: 10.45, change: 5.2 },
  { symbol: "ARB", price: 1.23, change: -0.5 },
  { symbol: "LINK", price: 18.76, change: 3.1 },
];

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: VISIBLE_ROWS }, (_, i) => (
        <div
          key={i}
          className="flex h-[52px] items-center gap-2.5 rounded-lg px-2.5"
        >
          <span className="size-6 shrink-0 animate-pulse rounded-full bg-bg-300" />
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="h-2.5 w-12 animate-pulse rounded bg-bg-300" />
              <span className="h-2.5 w-20 animate-pulse rounded bg-bg-300" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="h-2.5 w-14 animate-pulse rounded bg-bg-300" />
              <span className="h-2.5 w-8 animate-pulse rounded bg-bg-300" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function TokenRows() {
  return (
    <>
      {MOCK_TOKENS.map((token) => (
        <div
          key={token.symbol}
          className="flex h-[52px] items-center gap-2.5 rounded-lg px-2.5 transition-colors hover:bg-bg-200"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-300 text-[10px] font-bold text-fg-400">
            {token.symbol[0]}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold">{token.symbol}</span>
                <span className="rounded bg-bg-300 px-1 py-0.5 text-[10px] font-medium text-fg-400">
                  {getTokenName(token.symbol)}
                </span>
              </div>
              <span className="text-xs text-fg-400">{getTokenName(token.symbol)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium">
                ${token.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  token.change >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {token.change >= 0 ? "+" : ""}
                {token.change.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function StaggeredTokenRows() {
  return (
    <>
      {MOCK_TOKENS.map((token, i) => (
        <motion.div
          key={token.symbol}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
          className="flex h-[52px] items-center gap-2.5 rounded-lg px-2.5 transition-colors hover:bg-bg-200"
        >
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-300 text-[10px] font-bold text-fg-400">
            {token.symbol[0]}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold">{token.symbol}</span>
                <span className="rounded bg-bg-300 px-1 py-0.5 text-[10px] font-medium text-fg-400">
                  {getTokenName(token.symbol)}
                </span>
              </div>
              <span className="text-xs text-fg-400">{getTokenName(token.symbol)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium">
                ${token.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  token.change >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {token.change >= 0 ? "+" : ""}
                {token.change.toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
}

function useSimulatedLoad() {
  const [readyAt, setReadyAt] = useState(() => Date.now() + LOAD_DELAY);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (now >= readyAt) return;
    const timer = setTimeout(
      () => startTransition(() => setNow(Date.now())),
      readyAt - now,
    );
    return () => clearTimeout(timer);
  }, [now, readyAt]);

  const loaded = now >= readyAt;
  const reset = useCallback(() => {
    const t = Date.now();
    setReadyAt(t + LOAD_DELAY);
    setNow(t);
  }, []);
  return { loaded, reset };
}

function CardShell({
  title,
  subtitle,
  children,
  onReload,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onReload: () => void;
}) {
  return (
    <div className="flex w-72 flex-col gap-3">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold text-fg-base">{title}</h3>
          <p className="text-xs text-fg-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onReload}
          className="rounded-lg border border-border bg-bg-base px-3 py-1.5 text-xs font-medium text-fg-base transition-colors hover:bg-bg-200"
        >
          Reload
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-bg-base shadow-sm">
        <div className="px-3 py-2.5 text-xs font-semibold text-fg-400">
          Popular tokens
        </div>
        <div className="px-1 pb-1">{children}</div>
      </div>
    </div>
  );
}

function InstantTransition() {
  const { loaded, reset } = useSimulatedLoad();

  return (
    <CardShell
      title="Instant"
      subtitle="No transition"
      onReload={reset}
    >
      {loaded ? <TokenRows /> : <SkeletonRows />}
    </CardShell>
  );
}

function WipeTransition() {
  const { loaded, reset } = useSimulatedLoad();

  return (
    <CardShell title="Wipe (View Transition)" subtitle="AnimateView wipe reveal" onReload={reset}>
      <WipeReveal
        revealed={loaded}
        skeleton={<SkeletonRows />}
        className="bg-bg-base"
      >
        <TokenRows />
      </WipeReveal>
    </CardShell>
  );
}

function MaskWipeTransition() {
  const { loaded, reset } = useSimulatedLoad();

  return (
    <CardShell
      title="Mask Wipe"
      subtitle="CSS @property mask, DOM overlay"
      onReload={reset}
    >
      <style>{MASK_WIPE_STYLES}</style>
      <div className="relative overflow-hidden">
        {loaded ? <TokenRows /> : <SkeletonRows />}
        <div
          className="mask-wipe-overlay pointer-events-none absolute inset-0 bg-bg-base"
          data-revealed={loaded}
        >
          <SkeletonRows />
        </div>
      </div>
    </CardShell>
  );
}

function CrossfadeStaggerTransition() {
  const { loaded, reset } = useSimulatedLoad();

  return (
    <CardShell
      title="Crossfade + Stagger"
      subtitle="Fade out skeleton, stagger in rows"
      onReload={reset}
    >
      <AnimatePresence mode="wait">
        {loaded ? (
          <motion.div
            key="loaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <StaggeredTokenRows />
          </motion.div>
        ) : (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SkeletonRows />
          </motion.div>
        )}
      </AnimatePresence>
    </CardShell>
  );
}

export default function SkeletonTransitionsPage() {
  const [key, setKey] = useState(0);

  return (
    <div className="flex min-h-dvh flex-col items-center gap-10 bg-bg-base p-8 pt-16">
      <div className="text-center">
        <h1 className="text-h2 font-bold text-fg-base">
          Skeleton Transitions
        </h1>
        <p className="mt-1 text-sm text-fg-400">
          Compare three approaches to revealing content from skeleton loaders
        </p>
        <button
          type="button"
          onClick={() => setKey((k) => k + 1)}
          className="mt-4 rounded-lg border border-border bg-bg-base px-4 py-2 text-sm font-medium text-fg-base transition-colors hover:bg-bg-200"
        >
          Reload all
        </button>
      </div>

      <div key={key} className="flex flex-wrap items-start justify-center gap-8">
        <InstantTransition />
        <WipeTransition />
        <MaskWipeTransition />
        <CrossfadeStaggerTransition />
      </div>
    </div>
  );
}
