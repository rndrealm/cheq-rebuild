"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useTransform,
  animate as motionAnimate,
} from "motion/react";
import { cn } from "@/lib/utils";
import { DURATIONS } from "@/lib/constants/bets";

type DurationValue = (typeof DURATIONS)[number]["value"];

const ITEM_W = 36;
const GAP = 7;
const STEP = ITEM_W + GAP;
const COLLAPSED_COUNT = 2;
const EXPANDED_COUNT = 3;
const trackW = (n: number) => n * ITEM_W + (n - 1) * GAP;
const CYCLE_PX = DURATIONS.length * STEP;
const ITEMS = [...DURATIONS, ...DURATIONS];
const COLLAPSED_W = trackW(COLLAPSED_COUNT) + 8;
const EXPANDED_W = trackW(EXPANDED_COUNT) + 8;
const PAD = 4;

function closestTarget(current: number, target: number): number {
  const valid = [target, target + CYCLE_PX, target - CYCLE_PX].filter(
    (c) => c >= 0,
  );
  return valid.reduce((best, c) =>
    Math.abs(c - current) < Math.abs(best - current) ? c : best,
  );
}

function idealScroll(value: DurationValue): number {
  const idx = DURATIONS.findIndex((d) => d.value === value);
  return CYCLE_PX + (idx - 1) * STEP;
}

export function DurationPicker({
  value,
  onChange,
}: {
  value: DurationValue;
  onChange: (value: DurationValue) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [scrollPos, setScrollPos] = useState(() => idealScroll(value));
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef(false);
  const animatingRef = useRef(false);
  const pendingScrollRef = useRef<number | null>(idealScroll(value));
  const scrollTargetRef = useRef<{ at0: number; at1: number } | null>(null);

  const slideProgress = useMotionValue(0);
  const containerW = useTransform(
    slideProgress,
    [0, 1],
    [COLLAPSED_W, EXPANDED_W],
  );
  const chevronW = useTransform(slideProgress, [0, 1], [0, 16]);
  const chevronMargin = useTransform(slideProgress, [0, 1], [-GAP, 0]);

  useEffect(() => {
    return slideProgress.on("change", (t) => {
      const el = scrollRef.current;
      const target = scrollTargetRef.current;
      if (!el || !target) return;
      el.style.scrollBehavior = "auto";
      el.scrollLeft = target.at0 + (target.at1 - target.at0) * t;
      setScrollPos(el.scrollLeft);
    });
  }, [slideProgress]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pendingScrollRef.current !== null) {
      el.style.scrollBehavior = "auto";
      el.scrollLeft = pendingScrollRef.current;
      el.style.scrollBehavior = "";
      setScrollPos(pendingScrollRef.current);
      pendingScrollRef.current = null;
    }
  }, []);

  function scrollRight() {
    const el = scrollRef.current;
    if (!el || scrollingRef.current || animatingRef.current) return;

    scrollingRef.current = true;
    el.scrollBy({ left: STEP, behavior: "smooth" });

    setTimeout(() => {
      if (el.scrollLeft >= CYCLE_PX) {
        el.style.scrollBehavior = "auto";
        el.scrollLeft -= CYCLE_PX;
        el.style.scrollBehavior = "";
      }
      setScrollPos(el.scrollLeft);
      scrollingRef.current = false;
    }, 300);
  }

  function toggleExpanded(targetValue?: DurationValue) {
    const el = scrollRef.current;
    if (!el || animatingRef.current) return;

    animatingRef.current = true;

    if (expanded) {
      const activeValue = targetValue ?? value;
      const activeIdx = DURATIONS.findIndex((d) => d.value === activeValue);
      const s = el.scrollLeft;

      const inView = [activeIdx, activeIdx + DURATIONS.length]
        .map((i) => i * STEP)
        .some((p) => p >= s && p < s + COLLAPSED_COUNT * STEP);

      if (!inView) {
        const target = closestTarget(s, idealScroll(activeValue));
        scrollTargetRef.current = { at0: target, at1: s };
      }

      setExpanded(false);

      motionAnimate(slideProgress, 0, {
        duration: 0.25,
        ease: [0.33, 1, 0.68, 1],
        onComplete: () => {
          if (el.scrollLeft >= CYCLE_PX) {
            el.style.scrollBehavior = "auto";
            el.scrollLeft -= CYCLE_PX;
          }
          setScrollPos(el.scrollLeft);
          scrollTargetRef.current = null;
          animatingRef.current = false;
        },
      });
    } else {
      setExpanded(true);

      motionAnimate(slideProgress, 1, {
        duration: 0.25,
        ease: [0.33, 1, 0.68, 1],
        onComplete: () => {
          setScrollPos(el.scrollLeft);
          animatingRef.current = false;
        },
      });
    }
  }

  const progress = slideProgress.get();
  const currentW = containerW.get();

  return (
    <div className="flex items-center gap-1.75">
      <motion.button
        type="button"
        onClick={scrollRight}
        className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden"
        style={{
          width: chevronW,
          marginRight: chevronMargin,
          pointerEvents: expanded ? "auto" : "none",
        }}
      >
        <Image
          src="/media/chevron-left.svg"
          alt=""
          width={16}
          height={16}
          className="size-4 shrink-0"
        />
      </motion.button>

      <motion.div
        ref={scrollRef}
        onScroll={(e) => {
          if (!animatingRef.current) setScrollPos(e.currentTarget.scrollLeft);
        }}
        className="-m-1 flex gap-1.75 overflow-hidden p-1"
        style={{ width: containerW }}
      >
        {ITEMS.map((d, i) => {
          const itemCenter = PAD + i * STEP + ITEM_W / 2;
          const viewportCenter = scrollPos + currentW / 2;
          const dist = Math.abs(itemCenter - viewportCenter);
          const scaleAmount = progress * 0.1;
          const scale = 1 - scaleAmount * Math.min(dist / STEP, 1);

          return (
            <button
              key={`${d.value}-${i}`}
              type="button"
              onClick={() => {
                onChange(d.value);
                if (expanded) toggleExpanded(d.value);
              }}
              className={cn(
                "flex shrink-0 cursor-pointer items-center justify-center overflow-clip rounded-[10px] py-2 text-caption! font-medium text-black transition-colors",
                value === d.value &&
                  "bg-[#f3f3f3] shadow-[0_0_0_1px_rgba(0,0,0,0.11)]",
              )}
              style={{
                width: ITEM_W,
                transform: `scale(${scale})`,
                transition: "transform 150ms ease-out",
              }}
            >
              {d.label}
            </button>
          );
        })}
      </motion.div>

      <button
        type="button"
        onClick={() => toggleExpanded()}
        className="flex size-5 shrink-0 cursor-pointer items-center justify-center"
      >
        <Image
          src="/media/plus.svg"
          alt=""
          width={20}
          height={20}
          className={cn(
            "size-5 transition-transform duration-200",
            expanded && "rotate-45",
          )}
        />
      </button>
    </div>
  );
}
