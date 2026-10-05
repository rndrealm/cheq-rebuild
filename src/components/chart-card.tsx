"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Token } from "@/lib/helpers/bets";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/helpers/format";
import {
  generateMockCandles,
  sampleAt,
  MORPH_DURATION,
  type Candle,
} from "@/lib/helpers/mock-chart";
import { ChartToggleIcon } from "@/components/chart-toggle-icon";
import { GradientAvatar } from "@outpacelabs/avatars";
import {
  createChart,
  ColorType,
  AreaSeries,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";

type ChartCardProps = {
  token: Token;
  onToggle?: () => void;
  toggleLayoutId?: string;
};

const INTERVALS = ["1D", "1W", "1M", "1Y", "YTD", "All"] as const;

export function ChartCard({ token, onToggle, toggleLayoutId }: ChartCardProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi["addSeries"]> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const prevCandlesRef = useRef<Candle[]>([]);
  const animFrameRef = useRef<number>(0);
  const basePriceRef = useRef(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeInterval, setActiveInterval] = useState<string>("1D");
  const [priceData, setPriceData] = useState<{
    price: number;
    priceChange24h: number;
  } | null>(null);

  const getPrice = useAction(api.tokens.getPrice);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    let cancelled = false;

    async function init(container: HTMLDivElement) {
      setLoading(true);
      setError(false);

      try {
        const price = await getPrice({
          pairAddress: token.pairAddress,
          chain: token.chain,
        });

        if (cancelled) return;

        if (price) {
          setPriceData({
            price: price.price,
            priceChange24h: price.priceChange24h,
          });
          basePriceRef.current = price.price;
        }

        const chart = createChart(container, {
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#a6a6a6",
            fontFamily: "InterVariable, Inter, sans-serif",
            fontSize: 10,
            attributionLogo: false,
          },
          grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
          },
          width: container.clientWidth,
          height: 140,
          rightPriceScale: { visible: false },
          leftPriceScale: { visible: false },
          timeScale: {
            visible: false,
            fixLeftEdge: true,
            fixRightEdge: true,
            rightOffset: 0,
          },
          crosshair: {
            horzLine: { visible: false },
            vertLine: { color: "transparent", labelVisible: false },
          },
          handleScroll: false,
          handleScale: false,
        });

        const isPositive = price && price.priceChange24h >= 0;
        const lineColor = isPositive ? "#47a95e" : "#dc2626";

        const areaSeries = chart.addSeries(AreaSeries, {
          lineColor,
          topColor: "transparent",
          bottomColor: "transparent",
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerRadius: 10,
          crosshairMarkerBackgroundColor: "rgba(255, 255, 255, 0.45)",
          crosshairMarkerBorderColor: "rgba(255, 255, 255, 0.7)",
          crosshairMarkerBorderWidth: 1,
        });

        const candles = generateMockCandles(
          basePriceRef.current,
          "1D",
          token.symbol + token.chain,
        );
        prevCandlesRef.current = candles;
        areaSeries.setData(
          candles.map((c) => ({
            time: c.time as UTCTimestamp,
            value: c.value,
          })),
        );

        chart.timeScale().fitContent();
        chartRef.current = chart;
        seriesRef.current = areaSeries;

        const tooltip = document.createElement("div");
        tooltip.style.cssText =
          "position:absolute;pointer-events:none;display:none;z-index:10;transition:left 0.05s ease,top 0.05s ease";
        container.style.position = "relative";

        const bubble = document.createElement("div");
        bubble.style.cssText =
          "background:#F3F3F3;border:1px solid #FFFFFF;border-radius:12px;padding:8px 12px;text-align:center;white-space:nowrap";

        const priceEl = document.createElement("div");
        priceEl.style.cssText =
          "font-family:InterVariable,Inter,sans-serif;font-size:16px;font-weight:600;line-height:22px;color:#0b0b0b";

        const changeEl = document.createElement("div");
        changeEl.style.cssText =
          "font-family:InterVariable,Inter,sans-serif;font-size:12px;font-weight:500;line-height:16px;color:#7b7b7b";

        bubble.appendChild(priceEl);
        bubble.appendChild(changeEl);

        const pointer = document.createElement("div");
        pointer.style.cssText =
          "width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #F3F3F3;margin:-1px auto 0";

        tooltip.appendChild(bubble);
        tooltip.appendChild(pointer);
        container.appendChild(tooltip);
        tooltipRef.current = tooltip;

        const currentPrice = basePriceRef.current;
        const tooltipWidth = 103;

        chart.subscribeCrosshairMove((param) => {
          if (
            !param.point ||
            !param.time ||
            param.point.x < 0 ||
            param.point.y < 0
          ) {
            tooltip.style.display = "none";
            return;
          }

          const data = param.seriesData.get(areaSeries);
          if (!data) {
            tooltip.style.display = "none";
            return;
          }
          const hoveredPrice =
            "value" in data && data.value !== undefined
              ? data.value
              : "close" in data
                ? (data as { close: number }).close
                : null;
          if (hoveredPrice === null) {
            tooltip.style.display = "none";
            return;
          }

          const y = areaSeries.priceToCoordinate(hoveredPrice);
          if (y === null) {
            tooltip.style.display = "none";
            return;
          }

          const pctChange =
            ((hoveredPrice - currentPrice) / currentPrice) * 100;
          priceEl.textContent = formatPrice(hoveredPrice);
          changeEl.textContent =
            pctChange >= 0
              ? `+${pctChange.toFixed(2)}%`
              : `(${Math.abs(pctChange).toFixed(2)})%`;

          tooltip.style.display = "block";
          const left = Math.max(
            0,
            Math.min(
              param.point.x - tooltipWidth / 2,
              container.clientWidth - tooltipWidth,
            ),
          );
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${y - tooltip.offsetHeight - 14}px`;
        });

        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    init(container);

    const observer = new ResizeObserver(() => {
      chartRef.current?.applyOptions({ width: container.clientWidth });
    });
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
    };
  }, [token.pairAddress, token.chain, token.symbol, getPrice]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    const s = seriesRef.current;
    const ch = chartRef.current;

    cancelAnimationFrame(animFrameRef.current);

    const oldCandles = prevCandlesRef.current;
    const newCandles = generateMockCandles(
      basePriceRef.current,
      activeInterval,
      token.symbol + token.chain,
    );

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / MORPH_DURATION, 1);
      const ease = 1 - (1 - t) * (1 - t);

      const frames = newCandles.map((c, i) => {
        const norm = newCandles.length > 1 ? i / (newCandles.length - 1) : 0;
        const oldVal = sampleAt(oldCandles, norm);
        return {
          time: c.time as UTCTimestamp,
          value: oldVal + (c.value - oldVal) * ease,
        };
      });

      s.setData(frames);
      ch.timeScale().fitContent();

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        prevCandlesRef.current = newCandles;
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [activeInterval, token.symbol, token.chain]);

  const isPositive = priceData && priceData.priceChange24h >= 0;
  const changeColor = isPositive ? "text-[#47a95e]" : "text-destructive";

  return (
    <div className="flex w-79.25 flex-col overflow-clip rounded-[20px] border border-border bg-card pt-3">
      {/* Header */}
      <div className="flex items-center justify-between px-5.5 py-0.5">
        <div className="flex-1" />
        <span className="text-xs font-semibold text-fg-base">
          {token.symbol} ({token.chain.toUpperCase()})
        </span>
        <div className="flex flex-1 justify-end">
          <ChartToggleIcon
            className="shrink-0 cursor-pointer"
            layoutId={toggleLayoutId}
            onClick={onToggle ? () => onToggle() : undefined}
          />
        </div>
      </div>

      {/* Token Icon */}
      <div className="relative mx-auto mt-2 size-12">
        <GradientAvatar seed={token.symbol} size={48} />
        <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-lg border-2 border-white bg-[#47a95e] text-[10px] font-bold leading-none text-white">
          {token.chain.slice(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Chart — fixed height to prevent layout shift */}
      <div className="relative -mx-3 h-35 w-[calc(100%+1.5rem)]">
        {loading && !error && <div className="absolute inset-0" />}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-fg-300">Chart data unavailable</span>
          </div>
        )}
        <div
          ref={chartContainerRef}
          className={cn(
            "absolute inset-0",
            (loading || error) && "invisible",
          )}
        />
      </div>

      {/* Price + Change */}
      <div className="flex flex-col items-center gap-1 px-5.5 pt-3">
        <span className="text-[32px] font-semibold leading-10 text-fg-base">
          {priceData ? formatPrice(priceData.price) : "—"}
        </span>
        <span
          className={cn(
            "text-sm font-semibold leading-5",
            priceData ? changeColor : "invisible",
          )}
        >
          {priceData
            ? `${isPositive ? "+" : ""}${priceData.priceChange24h.toFixed(2)}% today`
            : "0.00% today"}
        </span>
      </div>

      {/* Interval Selector */}
      <div className="mt-auto flex items-center justify-center gap-0.5 px-5.5 pb-7 pt-4">
        {INTERVALS.map((interval) => (
          <button
            key={interval}
            onClick={() => setActiveInterval(interval)}
            className={cn(
              "relative cursor-pointer rounded-lg px-2 py-1.5 text-sm font-semibold leading-5 transition-colors",
              activeInterval === interval
                ? "text-fg-base"
                : "text-fg-300 hover:text-fg-400",
            )}
          >
            {activeInterval === interval && (
              <motion.span
                layoutId="interval-bg"
                className="absolute inset-0 rounded-lg bg-bg-200"
                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              />
            )}
            <span className="relative">{interval}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
