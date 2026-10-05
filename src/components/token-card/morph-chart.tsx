"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TOGGLE_D, INTERVAL_PATHS } from "@/lib/helpers/chart";
import { LiquidThumb } from "./liquid-thumb";
import type { CrosshairInfo } from "@/hooks/use-chart-interaction";

const CARD_W = 317;
const TOGGLE_SIZE = 32;
const CHART_H = 140;

const TOGGLE_TOP = 22;
const TOGGLE_LEFT = CARD_W - 22 - TOGGLE_SIZE;

const CHART_TOP = 100;
const CHART_LEFT = -12;
const CHART_W = CARD_W + 24;

const spring = { type: "spring" as const, duration: 0.45, bounce: 0.02 };

export { CHART_TOP, CHART_LEFT, CHART_W, CHART_H };

type MorphChartProps = {
  expanded: boolean;
  activeInterval: string;
  crosshair: CrosshairInfo;
  isDragging: boolean;
  onClick: () => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
};

export function MorphChart({
  expanded,
  activeInterval,
  crosshair,
  isDragging,
  onClick,
  onPointerDown,
  onMouseMove,
  onMouseLeave,
}: MorphChartProps) {
  const [showCrosshair, setShowCrosshair] = useState(false);

  useEffect(() => {
    if (!expanded) {
      setShowCrosshair(false);
      return;
    }
    const id = setTimeout(() => setShowCrosshair(true), 450);
    return () => clearTimeout(id);
  }, [expanded]);

  return (
    <motion.div
      className="absolute z-10 cursor-pointer"
      initial={false}
      animate={
        expanded
          ? {
              top: CHART_TOP,
              left: CHART_LEFT,
              width: CHART_W,
              height: CHART_H,
            }
          : {
              top: TOGGLE_TOP,
              left: TOGGLE_LEFT,
              width: TOGGLE_SIZE,
              height: TOGGLE_SIZE,
            }
      }
      transition={spring}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full bg-[#F3F3F3]"
        animate={{ opacity: expanded ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />

      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient
            id="chart-reveal"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset={`${(expanded ? crosshair.normX : 0) * 100}%`}
              stopColor="#47a95e"
            />
            <stop
              offset={`${(expanded ? crosshair.normX : 0) * 100}%`}
              stopColor="#D1D1D1"
            />
          </linearGradient>
        </defs>
        <motion.path
          animate={{
            d: expanded ? INTERVAL_PATHS[activeInterval] : TOGGLE_D,
          }}
          stroke={expanded ? "url(#chart-reveal)" : "#A6A6A6"}
          transition={spring}
          strokeWidth={3}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {expanded && showCrosshair && (
        <>
          {/* Vertical crosshair line */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-white/30"
            style={{ left: `${crosshair.normX * 100}%` }}
          />

          {/* Thumb anchor */}
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${crosshair.normX * 100}%`,
              top: `${crosshair.normY * 100}%`,
            }}
          >
            <LiquidThumb normX={crosshair.normX} isDragging={isDragging} />
          </div>
        </>
      )}
    </motion.div>
  );
}
