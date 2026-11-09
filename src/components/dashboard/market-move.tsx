"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { RemoteImage } from "@/components/ui/remote-image";
import mainAssets from "@/lib/assets";
import { getTokenImage } from "@/lib/constants/tokens";
import { cn } from "@/lib/utils";

const ROTATE_MS = 4000;
const REFRESH_MS = 60_000;
const ICONS_PER_LINE = 3;

// DEMO: sample stock data. We have no stocks feed yet.
const SAMPLE_STOCKS = [
  { ticker: "NVDA", change: 2.14 },
  { ticker: "AAPL", change: 0.82 },
  { ticker: "TSLA", change: -1.37 },
];
const SAMPLE_INDEX_CHANGE = 0.64;

// DEMO: shown only if live token prices can't be loaded.
const SAMPLE_TOKENS: TokenMove[] = [
  { symbol: "NEAR", change: 7.9 },
  { symbol: "SOL", change: 3.2 },
  { symbol: "ETH", change: 1.1 },
  { symbol: "BTC", change: -0.8 },
  { symbol: "ARB", change: -2.4 },
];

type TokenMove = { symbol: string; change: number };

type Line = {
  key: string;
  // Token symbols to show logos for. Stocks have no logos, so they show none.
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
  const stocks = [...SAMPLE_STOCKS].sort((a, b) => b.change - a.change);
  const topStock = stocks[0];

  return [
    {
      key: "market",
      icons: tokenIcons(sorted),
      before: "The market moved ",
      value: signed(average),
      after: " today.",
      change: average,
    },
    {
      key: "leader",
      icons: [best.symbol],
      before: `${best.symbol} leads today at `,
      value: signed(best.change),
      after: ".",
      change: best.change,
    },
    {
      key: "breadth",
      icons: tokenIcons(up.length > 0 ? up : sorted),
      before: "",
      value: `${up.length} of ${tokens.length}`,
      after: " tokens are up today.",
    },
    {
      key: "laggard",
      icons: [worst.symbol],
      before: `${worst.symbol} is the biggest mover down at `,
      value: signed(worst.change),
      after: ".",
      change: worst.change,
    },
    {
      key: "stocks",
      icons: [],
      before: "Stocks are ",
      value: signed(SAMPLE_INDEX_CHANGE),
      after: " on the S&P 500.",
      change: SAMPLE_INDEX_CHANGE,
    },
    {
      key: "top-stock",
      icons: [],
      before: `${topStock.ticker} leads stocks at `,
      value: signed(topStock.change),
      after: ".",
      change: topStock.change,
    },
  ];
}

// Survive Home remounting on page transitions, so the ticker shows straight
// away on the same line instead of disappearing until prices reload.
let lastTokens: TokenMove[] | null = null;
let lastTick = 0;

function useTokenMoves(): TokenMove[] | null {
  const getAllPrices = useAction(api.tokens.getAllPrices);
  const [tokens, setTokens] = useState<TokenMove[] | null>(lastTokens);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const prices = await getAllPrices();
        const moves = Object.entries(prices).map(([symbol, price]) => ({
          symbol,
          change: price.priceChange24h,
        }));
        if (cancelled) return;
        // Keep what's showing if a refresh comes back empty.
        lastTokens = moves.length > 0 ? moves : (lastTokens ?? SAMPLE_TOKENS);
        setTokens(lastTokens);
      } catch {
        if (cancelled) return;
        lastTokens = lastTokens ?? SAMPLE_TOKENS;
        setTokens(lastTokens);
      }
    }

    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [getAllPrices]);

  return tokens;
}

/** Header market ticker: rotates through token and stock highlights. */
export function MarketMove() {
  const tokens = useTokenMoves();
  const reducedMotion = useReducedMotion();
  const [tick, setTick] = useState(lastTick);
  const lines = useMemo(() => (tokens ? buildLines(tokens) : null), [tokens]);

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
