"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import mainAssets from "@/lib/assets";

const NUM_POINTS = 30;

const TOGGLE_POINTS: number[] = Array.from({ length: NUM_POINTS }, (_, i) => {
  const t = i / (NUM_POINTS - 1);
  return 0.5 + 0.18 * Math.sin(t * Math.PI * 2.5);
});

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generatePoints(seed: number, trend: number): number[] {
  const rand = seededRandom(seed);
  const raw: number[] = [];
  let value = 0.5 + (rand() - 0.5) * 0.2;
  for (let i = 0; i < NUM_POINTS; i++) {
    value += (rand() - 0.5) * 0.12 + trend / NUM_POINTS;
    raw.push(value);
  }
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const range = max - min || 1;
  return raw.map((v) => 0.1 + ((v - min) / range) * 0.8);
}

const INTERVAL_DATA: Record<string, number[]> = {
  "1D": generatePoints(42, -0.3),
  "1W": generatePoints(137, -0.15),
  "1M": generatePoints(291, 0.1),
  "1Y": generatePoints(503, -0.4),
  YTD: generatePoints(777, 0.25),
  All: generatePoints(1001, -0.2),
};

function toPathD(points: number[]): string {
  const coords = points.map((y, i) => ({
    x: i / (points.length - 1),
    y,
  }));

  let d = `M${coords[0].x.toFixed(4)},${coords[0].y.toFixed(4)}`;

  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(i - 1, 0)];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[Math.min(i + 2, coords.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x.toFixed(4)},${cp1y.toFixed(4)} ${cp2x.toFixed(4)},${cp2y.toFixed(4)} ${p2.x.toFixed(4)},${p2.y.toFixed(4)}`;
  }

  return d;
}

const TOGGLE_D = toPathD(TOGGLE_POINTS);
const INTERVAL_PATHS: Record<string, string> = Object.fromEntries(
  Object.entries(INTERVAL_DATA).map(([k, v]) => [k, toPathD(v)]),
);

const INTERVALS = ["1D", "1W", "1M", "1Y", "YTD", "All"] as const;

const CARD_W = 317;
const TOGGLE_SIZE = 32;
const CHART_H = 140;

const TOGGLE_TOP = 22;
const TOGGLE_LEFT = CARD_W - 22 - TOGGLE_SIZE;

const CHART_TOP = 100;
const CHART_LEFT = -12;
const CHART_W = CARD_W + 24;

const spring = { type: "spring" as const, duration: 0.45, bounce: 0.02 };

const THUMB_SIZE = 40;
const THUMB_BAR_W = 300;
const THUMB_BAR_H = 10;

const BASE_PRICE = 1847.32;
const PRICE_RANGE = 400;

function interpolateY(points: number[], normX: number): number {
  const floatIdx = normX * (points.length - 1);
  const i = Math.floor(floatIdx);
  if (i >= points.length - 1) return points[points.length - 1];
  const t = floatIdx - i;
  return points[i] + (points[i + 1] - points[i]) * t;
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const charSpring = { type: "spring" as const, duration: 0.25, bounce: 0 };

function CharSlide({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("inline-flex", className)}>
      {text.split("").map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          layout="position"
          transition={charSpring}
          className="inline-block"
          style={char === " " ? { width: "0.25em" } : undefined}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

type HoverInfo = {
  normX: number;
  normY: number;
  price: number;
  change: number;
};

export function ChartTransitionDemo() {
  const [expanded, setExpanded] = useState(false);
  const [activeInterval, setActiveInterval] = useState("1D");
  const [crosshair, setCrosshair] = useState<HoverInfo>(() => {
    const points = INTERVAL_DATA["1D"];
    const normY = interpolateY(points, 1);
    const price = BASE_PRICE + (0.5 - normY) * PRICE_RANGE;
    const change = ((price - BASE_PRICE) / BASE_PRICE) * 100;
    return { normX: 1, normY, price, change };
  });
  const [isHovering, setIsHovering] = useState(false);

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

  const tiltRef = useRef({ angle: 0, velocity: 0 });
  const prevXRef = useRef<number | null>(null);
  const prevTimeRef = useRef(0);
  const tooltipElRef = useRef<HTMLDivElement>(null);
  const tiltFrameRef = useRef(0);
  const tiltRunningRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);


  const startTiltLoop = useCallback(() => {
    if (tiltRunningRef.current) return;
    tiltRunningRef.current = true;

    const STIFFNESS = 180;
    const DAMPING = 22;
    const MAX_TILT = 25;
    let lastTime = performance.now();

    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const tilt = tiltRef.current;
      const springForce = -STIFFNESS * tilt.angle;
      const dampForce = -DAMPING * tilt.velocity;
      tilt.velocity += (springForce + dampForce) * dt;
      tilt.angle += tilt.velocity * dt;
      tilt.angle = Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt.angle));

      if (tooltipElRef.current) {
        tooltipElRef.current.style.transform = `translate(-50%, calc(-100% - 22px)) rotate(${tilt.angle.toFixed(2)}deg)`;
      }

      if (Math.abs(tilt.angle) > 0.01 || Math.abs(tilt.velocity) > 0.1) {
        tiltFrameRef.current = requestAnimationFrame(tick);
      } else {
        tilt.angle = 0;
        tilt.velocity = 0;
        tiltRunningRef.current = false;
        if (tooltipElRef.current) {
          tooltipElRef.current.style.transform =
            "translate(-50%, calc(-100% - 22px))";
        }
      }
    }

    tiltFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const handlePointerDown = useCallback(() => {
    if (!expanded) return;
    hasDraggedRef.current = true;
    isDraggingRef.current = true;
    setIsDragging(true);

    const handleUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    document.addEventListener("pointerup", handleUp, { once: true });
    document.addEventListener("pointercancel", handleUp, { once: true });
  }, [expanded]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(tiltFrameRef.current);
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!expanded) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const normX = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      const points = INTERVAL_DATA[activeInterval];
      const normY = interpolateY(points, normX);
      const price = BASE_PRICE + (0.5 - normY) * PRICE_RANGE;
      const change = ((price - BASE_PRICE) / BASE_PRICE) * 100;
      setCrosshair({ normX, normY, price, change });
      setIsHovering(true);

      const now = performance.now();
      const clientX = e.clientX;
      if (prevXRef.current !== null) {
        const dt = now - prevTimeRef.current;
        if (dt > 0) {
          const dx = clientX - prevXRef.current;
          const mouseVelocity = dx / dt;
          tiltRef.current.velocity += mouseVelocity * 60;
          startTiltLoop();
          if (isDraggingRef.current) {
            hasDraggedRef.current = true;
          }
        }
      }
      prevXRef.current = clientX;
      prevTimeRef.current = now;
    },
    [expanded, activeInterval, startTiltLoop],
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    prevXRef.current = null;
  }, []);

  const handleIntervalChange = useCallback((interval: string) => {
    setActiveInterval(interval);
    setCrosshair((prev) => {
      if (!prev) return prev;
      const points = INTERVAL_DATA[interval];
      const normY = interpolateY(points, prev.normX);
      const price = BASE_PRICE + (0.5 - normY) * PRICE_RANGE;
      const change = ((price - BASE_PRICE) / BASE_PRICE) * 100;
      return { ...prev, normY, price, change };
    });
  }, []);

  const tooltipLeft = CHART_LEFT + (crosshair ? crosshair.normX * CHART_W : 0);
  const tooltipTop = CHART_TOP + (crosshair ? crosshair.normY * CHART_H : 0);

  return (
    <div className="relative w-79.25">
      <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id="goo-thumb" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -10"
            />
          </filter>
        </defs>
      </svg>
      <motion.div className="relative h-100 w-full overflow-hidden rounded-[20px] border border-border bg-card">
        {/* ── Bet state: Header ── */}
        <AnimatePresence>
          {!expanded && (
            <motion.div
              key="bet"
              className="px-5.5 pt-5.5"
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Avatar + Name + Toggle spacer */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-3">
                  <Image
                    src={mainAssets.avatarImage}
                    alt="Alice"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold leading-5 text-fg-base">
                      M. Doom
                    </span>
                    <span className="text-xs font-medium leading-4 text-fg-300">
                      @mdoom
                    </span>
                  </div>
                </div>
                <div className="size-8" />
              </div>

              {/* Wager + Status */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[32px] font-semibold leading-10 text-fg-base">
                  $50
                </span>
                <div className="relative flex items-center justify-center overflow-clip rounded-full border-[0.5px] border-solid border-[#a6d2ff] px-4 py-1.75">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-b from-[#a6d2ff] from-[29%] to-[#85c1ff]"
                  />
                  <span className="relative text-caption! font-semibold! leading-4 text-[#059fff] [text-shadow:0px_0.5px_0px_#72b8fe]">
                    Active
                  </span>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_-1px_-1px_0px_0px_#70b8ff,inset_1px_1px_0px_0px_#dbedff]"
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
                      ETH goes
                    </span>
                    <span className="text-caption font-semibold leading-4 text-fg-base">
                      UP
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-semibold leading-4 text-fg-base">
                      Total Stake
                    </span>
                    <span className="text-caption font-semibold leading-4 text-fg-base">
                      50 Points
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-semibold leading-4 text-fg-base">
                      Reward Pool
                    </span>
                    <span className="text-caption font-semibold leading-4 text-fg-base">
                      100 Points
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer note */}
              <p className="mt-6 pb-0 text-xs font-medium leading-4 text-fg-300">
                The point system translates 1:1 with the USD, 1 point is equal
                to 1 USD
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Chart state ── */}

        {/* ── Morphing chart line ── */}
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
          onClick={() => {
            if (hasDraggedRef.current) {
              hasDraggedRef.current = false;
              return;
            }
            setExpanded((v) => !v);
          }}
          onPointerDown={handlePointerDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
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
                  offset={`${(crosshair && expanded ? crosshair.normX : 0) * 100}%`}
                  stopColor="#47a95e"
                />
                <stop
                  offset={`${(crosshair && expanded ? crosshair.normX : 0) * 100}%`}
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

          {/* Crosshair */}
          {expanded && crosshair && (
            <>
              {/* Vertical line */}
              <div
                className="pointer-events-none absolute top-0 bottom-0 w-px bg-white/30"
                style={{ left: `${crosshair.normX * 100}%` }}
              />

              {/* Thumb anchor on the path */}
              <div
                className="pointer-events-none absolute"
                style={{
                  left: `${crosshair.normX * 100}%`,
                  top: `${crosshair.normY * 100}%`,
                }}
              >
                {/* Liquid thumb — always visible, cover hides liquids when inactive */}
                <div
                  className="absolute"
                  style={{
                    width: THUMB_SIZE,
                    height: THUMB_SIZE,
                    transform: `translate(-50%, -50%) scale(${isDragging ? 1 : 0.5})`,
                    transition: "transform 0.2s ease-out",
                  }}
                >
                    {/* Glass indicator */}
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          background: "white",
                          position: "relative",
                          boxShadow:
                            "inset 1px -1px 2px #ffffff80, inset 0 -1px 2px #ffffff80, inset -1px -1px 2px #ffffff80, inset 1px 1px 2px #4d4d4d80, inset -8px 4px 10px -6px #4d4d4d40, inset -1px 1px 6px #4d4d4d40, -1px -1px 8px #99999926, 1px 1px 2px #4d4d4d26, 2px 2px 6px #4d4d4d26, inset -2px -1px 2px #ffffff40, 3px 6px 16px -6px #4d4d4d80",
                        }}
                      >
                        {/* Wrapper — clip + blur (unblurs on active) */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            clipPath: "inset(0 0 0 0 round 100px)",
                            filter: isDragging ? "blur(0px)" : "blur(4px)",
                            transition:
                              "filter 0.2s ease-out",
                          }}
                        >
                          {/* Fill liquids (green) */}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "50%",
                              overflow: "hidden",
                              filter: "url(#goo-thumb)",
                              transform: "translate3d(0,0,0)",
                              zIndex: 20,
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: "50%",
                                boxShadow: "inset 0 0 3px 4px #47a95e",
                                opacity: Math.min(1, crosshair.normX * 2),
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                height: THUMB_BAR_H,
                                width: THUMB_BAR_W,
                                top: "50%",
                                left: 0,
                                background: "#47a95e",
                                borderRadius: 100,
                                transform: `translate(${-THUMB_BAR_W + crosshair.normX * THUMB_SIZE}px, -50%)`,
                              }}
                            />
                          </div>

                          {/* Track liquids (grey) */}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "50%",
                              overflow: "hidden",
                              filter: "url(#goo-thumb)",
                              transform: "translate3d(0,0,0)",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: "50%",
                                boxShadow:
                                  "inset 0 0 3px 4px rgba(200,200,200,0.5)",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                height: THUMB_BAR_H,
                                width: THUMB_BAR_W,
                                top: "50%",
                                left: 0,
                                background: "#D1D1D1",
                                borderRadius: 100,
                                transform: `translate(${Math.round(THUMB_SIZE * 0.08)}px, -50%)`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Cover — opaque white, fades out to reveal liquids */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            background: "white",
                            opacity: isDragging ? 0 : 1,
                            transition:
                              "opacity 0.2s ease-out",
                          }}
                        />

                        {/* Shadow overlay — glass refraction, fades in on active */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            zIndex: 20,
                            opacity: isDragging ? 1 : 0,
                            transition:
                              "opacity 0.2s ease-out",
                            boxShadow:
                              "inset 1px -1px 2px #ffffff80, inset 0 -1px 2px #ffffff80, inset -1px -1px 2px #ffffff80, inset 1px 1px 2px #4d4d4d59, inset -8px 4px 10px -6px #4d4d4d26, inset -1px 1px 6px #4d4d4d26, -1px -1px 8px #9999991a, 1px 1px 2px #4d4d4d1a, 2px 2px 6px #4d4d4d1a, inset -2px -1px 2px #ffffff40, 3px 6px 16px -6px #4d4d4d59",
                          }}
                        />
                      </div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <div className="flex flex-col pt-3">
              {/* Group 1: Header + Token icon */}
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

              {/* Chart spacer (morph element is absolute) */}
              <div className="h-35" />

              {/* Group 2: Price + Change */}
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
                      text={formatPrice(crosshair?.price ?? BASE_PRICE)}
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
                      text={`${(crosshair?.change ?? 2.45) >= 0 ? "+" : ""}${(crosshair?.change ?? 2.45).toFixed(2)}%`}
                      className={cn(
                        "whitespace-nowrap text-sm font-semibold leading-5",
                        (crosshair?.change ?? 2.45) >= 0
                          ? "text-[#47a95e]"
                          : "text-destructive",
                      )}
                    />
                  </span>
                </div>
              </motion.div>

              {/* Group 3: Interval Selector */}
              <motion.div
                key="chart-intervals"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ duration: 0.2, delay: 0.24 }}
                className="mt-auto flex items-center justify-center gap-0.5 px-5.5 pb-7 pt-4"
              >
                {INTERVALS.map((interval) => (
                  <button
                    key={interval}
                    onClick={() => handleIntervalChange(interval)}
                    className={cn(
                      "relative cursor-pointer rounded-lg px-2 py-1.5 text-sm font-semibold leading-5 transition-colors",
                      activeInterval === interval
                        ? "text-fg-base"
                        : "text-fg-300 hover:text-fg-400",
                    )}
                  >
                    {activeInterval === interval && (
                      <motion.span
                        layoutId="demo-interval-bg"
                        className="absolute inset-0 rounded-lg bg-bg-200"
                        transition={{
                          type: "spring",
                          duration: 0.4,
                          bounce: 0.15,
                        }}
                      />
                    )}
                    <span className="relative">{interval}</span>
                  </button>
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tooltip — outside card overflow */}
      {expanded && crosshair && isHovering && (
        <div
          ref={tooltipElRef}
          className="pointer-events-none absolute z-20"
          style={{
            left: tooltipLeft,
            top: tooltipTop,
            transform: "translate(-50%, calc(-100% - 22px))",
            transformOrigin: "bottom center",
          }}
        >
          <div className="rounded-xl border border-white bg-[#F3F3F3] px-3 py-2 text-center whitespace-nowrap">
            <div className="text-base font-semibold leading-5.5 text-[#0b0b0b]">
              {formatPrice(crosshair.price)}
            </div>
            <div className="text-xs font-medium leading-4 text-[#7b7b7b]">
              {crosshair.change >= 0
                ? `+${crosshair.change.toFixed(2)}%`
                : `-${Math.abs(crosshair.change).toFixed(2)}%`}
            </div>
          </div>
          {/* Arrow */}
          <div className="mx-auto -mt-px h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-[#F3F3F3]" />
        </div>
      )}
    </div>
  );
}
