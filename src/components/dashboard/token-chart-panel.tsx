"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RemoteImage } from "@/components/ui/remote-image";
import { ChartTooltip } from "@/components/token-card/chart-tooltip";
import { useChartInteraction } from "@/hooks/use-chart-interaction";
import { useTilt } from "@/hooks/use-tilt";
import { useTokenChart } from "@/hooks/use-token-chart";
import { useTokenStats, type TokenStats } from "@/hooks/use-market";
import mainAssets from "@/lib/assets";
import { getTokenImage, getTokenName } from "@/lib/constants/tokens";
import { formatPrice } from "@/lib/helpers/format";
import { ContrastIcon, InfoIcon, StarIcon } from "@/lib/svgs";
import { cn } from "@/lib/utils";

const RANGES = ["1D", "1W", "1M", "6M", "1Y", "All"] as const;
type Range = (typeof RANGES)[number];

const spring = { type: "spring" as const, duration: 0.45, bounce: 0.02 };

// Raised grey surface shared by the toolbar buttons and the stats card.
const RAISED_INSET =
  "shadow-[inset_1px_-1px_2px_0px_rgba(255,255,255,0.25),inset_0px_1px_3px_0px_white]";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

/**
 * Home page market panel: a token's price, 24h stats and price chart. Mount
 * one per token (key by symbol) so its chart data starts clean.
 */
export function TokenChartPanel({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<Range>("1W");
  const [showStats, setShowStats] = useState(false);
  const stats = useTokenStats(symbol);
  const { data, fetchInterval } = useTokenChart(symbol);
  const chart = data[range] ?? null;

  useEffect(() => {
    void fetchInterval(range);
  }, [fetchInterval, range]);

  const { elRef: tooltipRef, addVelocity } = useTilt();
  const { crosshair, isHovering, handleMouseMove, handleMouseLeave } =
    useChartInteraction(true, chart, addVelocity);

  const lineColor =
    chart && chart.latestPrice < chart.basePrice
      ? "var(--price-down)"
      : "var(--price-up)";

  return (
    <section className="relative flex h-108.25 min-w-0 flex-col">
      {/* Token + toolbar */}
      <div className="flex items-center justify-between gap-4 px-2.5 pt-2.5">
        <div className="flex min-w-0 items-center gap-4">
          <RemoteImage
            src={getTokenImage(symbol)}
            alt={symbol}
            size={26}
            fallback={mainAssets.baseImage}
          />
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium leading-5 tracking-[-0.0046em]">
            <span className="text-gray-12">{symbol}</span>
            <span className="truncate text-gray-12/55">
              {getTokenName(symbol)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ToolbarButton label="Contrast" disabled>
            <ContrastIcon className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Token stats"
            onHoverChange={setShowStats}
          >
            <InfoIcon className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton label="Add to favourites" disabled>
            <StarIcon className="size-3.5" />
          </ToolbarButton>
        </div>
      </div>

      {/* Price */}
      <div className="mt-4 flex h-8 items-end gap-2 px-2.5 font-display font-semibold">
        {stats ? (
          <>
            <span className="text-[32px] leading-8 tabular-nums text-fg-base">
              {formatPrice(stats.price)}
            </span>
            <Change24h stats={stats} />
          </>
        ) : (
          <div className="h-8 w-44 animate-pulse rounded-lg bg-gray-4" />
        )}
      </div>

      <AnimatePresence>
        {showStats && stats && <StatsCard stats={stats} />}
      </AnimatePresence>

      {/* Chart */}
      <div
        className="relative mt-12 mb-8 min-h-0 flex-1"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {chart ? (
          <>
            <svg
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <motion.path
                initial={false}
                animate={{ d: chart.path }}
                transition={spring}
                style={{ stroke: lineColor }}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {isHovering && (
              <div
                className="pointer-events-none absolute"
                style={{
                  left: `${crosshair.normX * 100}%`,
                  top: `${crosshair.normY * 100}%`,
                }}
              >
                <span
                  className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                  // Tinted to match the line, at 25% opacity
                  style={{
                    boxShadow: `1px 2px 4px 0px color-mix(in srgb, ${lineColor} 25%, transparent)`,
                  }}
                />
                <ChartTooltip
                  ref={tooltipRef}
                  crosshair={crosshair}
                  left={0}
                  top={0}
                />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-x-2.5 top-1/2 h-0.5 animate-pulse rounded-full bg-gray-5" />
        )}
      </div>

      {/* Ranges */}
      <div className="ml-2.5 flex h-14 shrink-0 items-center gap-1.75 border-t border-black/4">
        {RANGES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={value === range}
            onClick={() => setRange(value)}
            className={cn(
              "flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-[10px] px-1.75 font-display text-caption font-medium leading-4 text-black outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              value === range
                ? "bg-[#f3f3f3] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.11)]"
                : "hover:bg-[#f3f3f3]",
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </section>
  );
}

// Binance's rolling 24h change, so "in 24h" rather than "today".
function Change24h({ stats }: { stats: TokenStats }) {
  const up = stats.priceChange24h >= 0;
  const sign = up ? "+" : "-";
  const amount = formatPrice(Math.abs(stats.priceChangeAbs24h)).replace("$", "");
  return (
    <span
      className={cn(
        "text-sm leading-5 tabular-nums",
        up ? "text-price-up" : "text-price-down",
      )}
    >
      {sign}
      {amount} ({sign}
      {Math.abs(stats.priceChange24h).toFixed(2)}%) in 24h
    </span>
  );
}

function ToolbarButton({
  label,
  disabled,
  onHoverChange,
  children,
}: {
  label: string;
  disabled?: boolean;
  // Hover or keyboard focus
  onHoverChange?: (active: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      className={cn(
        "flex size-6.5 items-center justify-center rounded-md bg-[#f2f2f2] text-gray-12 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04),0px_0px_0px_1px_rgba(0,0,0,0.05)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        !disabled && "hover:bg-gray-4",
      )}
    >
      {children}
    </button>
  );
}

function StatsCard({ stats }: { stats: TokenStats }) {
  const items = [
    { label: "24H VOL", value: compactUsd.format(stats.volume) },
    { label: "24H HIGH", value: formatPrice(stats.high24h) },
    { label: "24H LOW", value: formatPrice(stats.low24h) },
    { label: "24H OPEN", value: formatPrice(stats.open24h) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="pointer-events-none absolute top-10.25 right-0 z-10 hidden overflow-clip rounded-md bg-[#f2f2f2] px-2.5 pt-2 pb-1.5 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08),0px_8px_24px_2px_rgba(0,0,0,0.04),0px_0px_0px_1px_rgba(0,0,0,0.05)] md:block"
    >
      <div className="flex items-center">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center">
            {i > 0 && <div className="mx-6 h-7.5 w-px bg-black/8" />}
            <div className="flex min-w-15.75 flex-col gap-1 font-medium">
              <span className="text-xs leading-3.5 tracking-[-0.0046em] text-[#8a8a8a]">
                {item.label}
              </span>
              <span className="text-sm leading-5 tracking-[-0.0046em] tabular-nums text-fg-base">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          RAISED_INSET,
        )}
      />
    </motion.div>
  );
}
