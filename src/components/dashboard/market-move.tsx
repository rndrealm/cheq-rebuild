"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RemoteImage } from "@/components/ui/remote-image";
import { useMarket } from "@/hooks/use-market";
import mainAssets from "@/lib/assets";
import { getTokenImage } from "@/lib/constants/tokens";
import { cn } from "@/lib/utils";

const ROTATE_MS = 4000;
const ICONS_PER_LINE = 3;

// Moves are Binance's rolling 24h change, and "Crypto" is the plain average
// of our 24 tokens. Shown to one decimal, so anything smaller reads as no move.
const FLAT_THRESHOLD = 0.05;

type TokenMove = { symbol: string; change: number };

type Line = {
  key: string;
  // Token symbols to show logos for.
  icons: string[];
  before: string;
  value: string;
  after: string;
  // Colours the value; omit for neutral counts.
  change?: number;
};

const signed = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const tokenIcons = (tokens: TokenMove[]) =>
  tokens.slice(0, ICONS_PER_LINE).map(({ symbol }) => symbol);

function buildLines(tokens: TokenMove[]): Line[] {
  const sorted = [...tokens].sort((a, b) => b.change - a.change);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const average =
    tokens.reduce((sum, token) => sum + token.change, 0) / tokens.length;
  const up = tokens.filter((token) => token.change > 0);
  const lines: Line[] = [];

  lines.push(
    Math.abs(average) < FLAT_THRESHOLD
      ? {
          key: "market",
          icons: tokenIcons(sorted),
          before: "Crypto is ",
          value: "flat",
          after: " over 24h.",
        }
      : {
          key: "market",
          icons: tokenIcons(sorted),
          before: "Crypto moved ",
          value: signed(average),
          after: " in 24h.",
          change: average,
        },
  );

  // Only when something is actually up.
  if (best.change >= FLAT_THRESHOLD) {
    lines.push({
      key: "leader",
      icons: [best.symbol],
      before: `${best.symbol} leads at `,
      value: signed(best.change),
      after: " in 24h.",
      change: best.change,
    });
  }

  lines.push({
    key: "breadth",
    icons: tokenIcons(up.length > 0 ? up : sorted),
    before: "",
    value: `${up.length} of ${tokens.length}`,
    after: " tokens are up in 24h.",
  });

  // Only when something is actually down.
  if (worst.change <= -FLAT_THRESHOLD) {
    lines.push({
      key: "laggard",
      icons: [worst.symbol],
      before: `${worst.symbol} is the biggest mover down at `,
      value: signed(worst.change),
      after: " in 24h.",
      change: worst.change,
    });
  }

  return lines;
}

// Keeps the rotation where it was when Home remounts on a page transition.
let lastTick = 0;

/** Header market ticker: rotates through highlights of our tokens' 24h moves. */
export function MarketMove() {
  const market = useMarket();
  const reducedMotion = useReducedMotion();
  const [tick, setTick] = useState(lastTick);
  const lines = useMemo(() => {
    if (!market || market.size === 0) return null;
    const moves = [...market.values()].map(({ symbol, priceChange24h }) => ({
      symbol,
      change: priceChange24h,
    }));
    return buildLines(moves);
  }, [market]);

  useEffect(() => {
    const id = setInterval(() => {
      lastTick += 1;
      setTick(lastTick);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  if (!lines) return null;

  const line = lines[tick % lines.length];
  const offset = reducedMotion ? 0 : 8;

  return (
    <div className="min-w-0 overflow-hidden" aria-live="off">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={line.key}
          initial={{ opacity: 0, y: offset }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -offset }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center justify-end gap-3"
        >
          {line.icons.length > 0 && (
            <div className="flex shrink-0 -space-x-2">
              {line.icons.map((symbol) => (
                <RemoteImage
                  key={symbol}
                  src={getTokenImage(symbol)}
                  alt=""
                  size={24}
                  fallback={mainAssets.baseImage}
                  className="ring-2 ring-card"
                />
              ))}
            </div>
          )}
          <p className="truncate text-base leading-6 font-medium tracking-[-0.024em] text-gray-12">
            {line.before}
            <span
              className={cn(
                "tabular-nums",
                line.change === undefined
                  ? "text-fg-base"
                  : line.change >= 0
                    ? "text-[#47a95e]"
                    : "text-destructive",
              )}
            >
              {line.value}
            </span>
            {line.after}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
