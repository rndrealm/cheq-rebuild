"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { GradientAvatar } from "@outpacelabs/avatars";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/helpers/format";
import {
  getStatusConfig,
  getBetDescription,
  type FeedBet,
} from "@/lib/helpers/bets";
import { AppRoutes } from "@/lib/routes";
import mainAssets from "@/lib/assets";
import { GooFilter } from "./goo-filter";
import { MorphChart, CHART_TOP, CHART_LEFT, CHART_W, CHART_H } from "./morph-chart";
import { ChartTooltip } from "./chart-tooltip";
import { IntervalSelector } from "./interval-selector";
import { CharSlide } from "./char-slide";
import { BetDialog, type BetDirection } from "./bet-dialog";
import { useTilt } from "@/hooks/use-tilt";
import { useChartInteraction } from "@/hooks/use-chart-interaction";

export function TokenCard({
  bet,
  onDirectionChange,
}: {
  bet: FeedBet;
  onDirectionChange?: (direction: BetDirection) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeInterval, setActiveInterval] = useState("1D");
  const [showBetDialog, setShowBetDialog] = useState(false);

  const { elRef: tooltipRef, addVelocity } = useTilt();

  const openBetDialog = useCallback(() => {
    setShowBetDialog(true);
  }, []);

  const {
    crosshair,
    isHovering,
    isDragging,
    handlePointerDown,
    handleMouseMove,
    handleMouseLeave,
    handleIntervalChange: updateCrosshairForInterval,
    consumeDrag,
  } = useChartInteraction(expanded, activeInterval, addVelocity, openBetDialog);

  const handleIntervalChange = useCallback(
    (interval: string) => {
      setActiveInterval(interval);
      updateCrosshairForInterval(interval);
    },
    [updateCrosshairForInterval],
  );

  const handleChartClick = useCallback(() => {
    if (consumeDrag()) return;
    setExpanded((v) => !v);
  }, [consumeDrag]);

  const priceWrapperRef = useRef<HTMLDivElement>(null);
  const priceTextRef = useRef<HTMLSpanElement>(null);
  const changeWrapperRef = useRef<HTMLDivElement>(null);
  const changeTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!expanded) return;
    function center(wrapper: HTMLElement | null, text: HTMLElement | null) {
      if (!wrapper || !text) return;
      wrapper.style.paddingLeft = "0";
      const gap = wrapper.clientWidth - text.offsetWidth;
      wrapper.style.paddingLeft = `${Math.max(0, gap / 2)}px`;
    }
    requestAnimationFrame(() => {
      center(priceWrapperRef.current, priceTextRef.current);
      center(changeWrapperRef.current, changeTextRef.current);
    });
  }, [expanded, activeInterval]);

  const tooltipLeft = CHART_LEFT + crosshair.normX * CHART_W;
  const tooltipTop = CHART_TOP + crosshair.normY * CHART_H;

  const creatorName = bet.creator?.name ?? "Unknown";
  const creatorUsername = bet.creator?.username;
  const statusConfig = getStatusConfig(bet.status, null);
  const description = getBetDescription(bet);
  const rewardPool = bet.creatorWager + bet.opponentWager;

  return (
    <div className="relative w-79.25">
      <GooFilter />
      <motion.div className="relative h-100 w-full overflow-hidden rounded-[20px] border border-border bg-card" style={{ boxShadow: "0px 4px 20px 0px #00000014" }}>
        {/* Morph chart — always mounted for smooth animation */}
        <MorphChart
          expanded={expanded}
          activeInterval={activeInterval}
          crosshair={crosshair}
          isDragging={isDragging}
          onClick={handleChartClick}
          onPointerDown={handlePointerDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        <AnimatePresence>
          {!expanded && (
            <motion.div
              key="bet"
              className="px-5.5 pt-5.5"
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                href={AppRoutes.betDetail.path(bet._id)}
                className="flex flex-col"
              >
                {/* Avatar + Name */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-3">
                    <GradientAvatar seed={creatorName} size={48} />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold leading-5 text-fg-base">
                        {creatorName}
                      </span>
                      {creatorUsername && (
                        <span className="text-xs font-medium leading-4 text-fg-300">
                          @{creatorUsername}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="size-8" />
                </div>

                {/* Wager + Status */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[32px] font-semibold leading-10 text-fg-base">
                    ${bet.creatorWager}
                  </span>
                  <div
                    className={cn(
                      "relative flex items-center justify-center overflow-clip rounded-full border-[0.5px] border-solid px-4 py-1.75",
                      statusConfig.border,
                    )}
                  >
                    <div
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-0 rounded-full bg-linear-to-b",
                        statusConfig.gradient,
                      )}
                    />
                    <span
                      className={cn(
                        "relative text-caption! font-semibold! leading-4",
                        statusConfig.text,
                        statusConfig.textShadow,
                      )}
                    >
                      {statusConfig.label}
                    </span>
                    <div
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-0 rounded-[inherit]",
                        statusConfig.insetShadow,
                      )}
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="my-4.5 w-full border-t border-border" />

                {/* Stake Details */}
                <div className="flex flex-col gap-4">
                  <span className="text-caption font-semibold leading-4 text-fg-base">
                    Stake Details
                  </span>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-semibold leading-4 text-fg-base">
                        {description.label}
                      </span>
                      <span className="text-caption font-semibold leading-4 text-fg-base">
                        {description.value}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-semibold leading-4 text-fg-base">
                        Total Stake
                      </span>
                      <span className="text-caption font-semibold leading-4 text-fg-base">
                        {bet.creatorWager} Points
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-caption font-semibold leading-4 text-fg-base">
                        Reward Pool
                      </span>
                      <span className="text-caption font-semibold leading-4 text-fg-base">
                        {rewardPool} Points
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer note */}
                <p className="mt-6 pb-0 text-xs font-medium leading-4 text-fg-300">
                  The point system translates 1:1 with the USD, 1 point is equal
                  to 1 USD
                </p>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {expanded && (
            <div className="flex flex-col pt-3">
              <motion.div
                key="chart-header"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ duration: 0.2, delay: 0.08 }}
              >
                <div className="flex items-center justify-between px-5.5 py-0.5">
                  <div className="flex-1" />
                  <span className="text-xs font-semibold text-fg-base">
                    ETH (SOL)
                  </span>
                  <div className="flex flex-1 justify-end">
                    <div className="size-8" />
                  </div>
                </div>
                <div className="relative mx-auto mt-2 size-12">
                  <Image
                    src={mainAssets.baseImage}
                    alt="BASE"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <Image
                    src={mainAssets.usdImage}
                    alt="USD"
                    width={24}
                    height={24}
                    className="absolute -bottom-1 -right-1 rounded-lg"
                  />
                </div>
              </motion.div>

              <div className="h-35" />

              <motion.div
                key="chart-price"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ duration: 0.2, delay: 0.16 }}
                className="flex w-full flex-col gap-1 px-5.5 pt-3"
              >
                <div
                  ref={priceWrapperRef}
                  className="transition-[padding] duration-150 ease-out"
                >
                  <span ref={priceTextRef} className="inline-block">
                    <CharSlide
                      text={formatPrice(crosshair.price)}
                      className="whitespace-nowrap text-[32px] font-semibold leading-10 text-fg-base"
                    />
                  </span>
                </div>
                <div
                  ref={changeWrapperRef}
                  className="transition-[padding] duration-150 ease-out"
                >
                  <span ref={changeTextRef} className="inline-block">
                    <CharSlide
                      text={`${crosshair.change >= 0 ? "+" : ""}${crosshair.change.toFixed(2)}%`}
                      className={cn(
                        "whitespace-nowrap text-sm font-semibold leading-5",
                        crosshair.change >= 0
                          ? "text-[#47a95e]"
                          : "text-destructive",
                      )}
                    />
                  </span>
                </div>
              </motion.div>

              <motion.div
                key="chart-intervals"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ duration: 0.2, delay: 0.24 }}
              >
                <IntervalSelector
                  activeInterval={activeInterval}
                  onIntervalChange={handleIntervalChange}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBetDialog && (
            <BetDialog
              onClose={() => {
                setShowBetDialog(false);
                onDirectionChange?.(null);
              }}
              onDirectionChange={onDirectionChange}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {expanded && isHovering && (
        <ChartTooltip
          ref={tooltipRef}
          crosshair={crosshair}
          left={tooltipLeft}
          top={tooltipTop}
        />
      )}
    </div>
  );
}
