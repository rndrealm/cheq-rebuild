"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  BetCarouselCard,
  CARD_HEIGHT,
  CARD_WIDTH,
} from "@/components/dashboard/bet-carousel-card";
import { useDrag } from "@/hooks/use-drag";
import type { FeedBet } from "@/lib/helpers/bets";
import {
  applyRubberBand,
  clamp,
  DECELERATION,
  project,
  springFromResponse,
} from "@/lib/physics";
import { cn } from "@/lib/utils";

// Side cards are the centre card at this scale, 32px apart.
const SIDE_SCALE = 0.812;
const CARD_GAP = 32;
const SIDE_WIDTH = CARD_WIDTH * SIDE_SCALE;
// Centre card to its neighbour, then neighbour to neighbour.
const NEAR_STEP = CARD_WIDTH / 2 + CARD_GAP + SIDE_WIDTH / 2;
const FAR_STEP = SIDE_WIDTH + CARD_GAP;

// A press that moves less than this is a tap on a card.
const TAP_DISTANCE = 6;
const WHEEL_SNAP_DELAY_MS = 120;
const MAX_DOTS = 6;

// Same physics as the "Paging" scroller in rndr-interactions: PAGE snaps to
// the card the flick projects onto; BOUNCE returns from past either end.
const PAGE = springFromResponse(0.4, 1);
const BOUNCE = springFromResponse(0.5, 1);

// Lets the page you're leaving start first; neighbours follow the centre card.
const ENTER_DELAY_S = 0.075;
const ENTER_STAGGER_S = 0.038;

function Slide({
  bet,
  index,
  firstVisible,
  progress,
  animateIn,
}: {
  bet: FeedBet;
  index: number;
  firstVisible: number;
  progress: MotionValue<number>;
  animateIn: boolean;
}) {
  // Distance from the centre, in cards.
  const x = useTransform(progress, (p) => {
    const d = index - p;
    const near = clamp(d, -1, 1) * NEAR_STEP;
    return near + Math.sign(d) * Math.max(0, Math.abs(d) - 1) * FAR_STEP;
  });
  const scale = useTransform(
    progress,
    (p) => 1 - (1 - SIDE_SCALE) * Math.min(1, Math.abs(index - p)),
  );

  return (
    <motion.div
      style={{ x, scale, marginLeft: -CARD_WIDTH / 2 }}
      className="absolute top-0 left-1/2"
    >
      <motion.div
        initial={animateIn ? { opacity: 0, scale: 0.92 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.18,
          ease: [0, 0, 0.2, 1],
          delay: ENTER_DELAY_S + Math.abs(index - firstVisible) * ENTER_STAGGER_S,
        }}
      >
        <BetCarouselCard bet={bet} index={index} />
      </motion.div>
    </motion.div>
  );
}

/**
 * Feed carousel: one large centred card with smaller neighbours. Drag or flick
 * to move (it snaps to the nearest card), or use the trackpad, the arrow keys,
 * or a tap on a side card.
 */
export function BetCarousel({ bets }: { bets: FeedBet[] }) {
  const reducedMotion = useReducedMotion();
  // Open on the second card so there's a neighbour on both sides.
  const startIndex = Math.min(1, bets.length - 1);
  const [index, setIndex] = useState(startIndex);
  const last = bets.length - 1;
  const current = Math.min(index, last);

  const containerRef = useRef<HTMLDivElement>(null);
  // Position in cards, fractional mid-gesture.
  const progress = useMotionValue(startIndex);
  const originPx = useRef(0);
  const startX = useRef(0);
  const moved = useRef(0);
  const wheelTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const goTo = useCallback(
    (target: number, velocity = 0, spring = PAGE) => {
      const next = clamp(target, 0, last);
      setIndex(next);
      animate(progress, next, { ...spring, velocity });
    },
    [last, progress],
  );

  const drag = useDrag({
    onStart: (start) => {
      progress.stop();
      originPx.current = -progress.get() * NEAR_STEP;
      startX.current = start.x;
      moved.current = 0;
    },
    onMove: (delta) => {
      moved.current = Math.max(moved.current, Math.abs(delta.x));
      const px = applyRubberBand(
        originPx.current + delta.x,
        -last * NEAR_STEP,
        0,
        containerRef.current!.clientWidth,
      );
      progress.set(-px / NEAR_STEP);
    },
    onEnd: (velocity) => {
      if (moved.current < TAP_DISTANCE) {
        const box = containerRef.current!.getBoundingClientRect();
        const fromCentre = startX.current - (box.left + box.width / 2);
        if (Math.abs(fromCentre) > CARD_WIDTH / 2) {
          const away = Math.abs(fromCentre) - NEAR_STEP + SIDE_WIDTH / 2;
          const steps = 1 + Math.max(0, Math.floor(away / FAR_STEP));
          goTo(current + Math.sign(fromCentre) * steps);
        } else {
          goTo(current);
        }
        return;
      }
      const position = progress.get();
      const cardVelocity = -velocity.x / NEAR_STEP;

      // Released past an end: settle back there, keeping the release speed.
      if (position < 0 || position > last) {
        goTo(position < 0 ? 0 : last, cardVelocity, BOUNCE);
        return;
      }

      const landing =
        position - project(velocity.x, DECELERATION.fast) / NEAR_STEP;
      goTo(Math.round(landing), cardVelocity);
    },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, goTo]);

  // Sideways trackpad scrolling, snapping once it stops. Native listener:
  // React's is passive, and this shouldn't trigger browser back-swipe.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      progress.stop();
      progress.set(clamp(progress.get() + e.deltaX / NEAR_STEP, 0, last));
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(
        () => goTo(Math.round(progress.get())),
        WHEEL_SNAP_DELAY_MS,
      );
    }

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
    };
  }, [goTo, last, progress]);

  // Keep the carousel on a real card if the list shrinks.
  useEffect(() => {
    if (progress.get() > last) animate(progress, Math.max(0, last), PAGE);
  }, [last, progress]);

  // A window of dots around the current card, so long lists stay short.
  const dotCount = Math.min(bets.length, MAX_DOTS);
  const firstDot = clamp(
    current - Math.floor(dotCount / 2),
    0,
    bets.length - dotCount,
  );

  return (
    <>
      <div
        ref={containerRef}
        {...drag}
        role="group"
        aria-roledescription="carousel"
        aria-label="Your bets"
        className="relative -mx-8 cursor-grab touch-pan-y overflow-hidden select-none active:cursor-grabbing"
        style={{ height: CARD_HEIGHT }}
      >
        {bets.map((bet, i) => (
          <Slide
            key={bet._id}
            bet={bet}
            index={i}
            firstVisible={current}
            progress={progress}
            animateIn={!reducedMotion}
          />
        ))}
      </div>

      {/* Lines up with the left-hand card. */}
      <div className="relative mt-8.25 h-2">
        <div className="absolute left-[max(0px,calc(50%-448px))] flex gap-1">
          {Array.from({ length: dotCount }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 rounded-[20px] transition-[width,background-color] duration-200",
                firstDot + i === current
                  ? "w-5.5 bg-[#d6d6d6]"
                  : "w-2 bg-[#ebebeb]",
              )}
            />
          ))}
        </div>
      </div>
    </>
  );
}
