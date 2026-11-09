"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { RemoteImage } from "@/components/ui/remote-image";
import { useDrag } from "@/hooks/use-drag";
import mainAssets from "@/lib/assets";
import { getTokenImage } from "@/lib/constants/tokens";
import { formatTimeAgo } from "@/lib/helpers/bet-events";
import {
  applyRubberBand,
  clamp,
  DECELERATION,
  project,
  springFromResponse,
} from "@/lib/physics";
import { AppRoutes } from "@/lib/routes";
import { DollarIcon, TrashIcon } from "@/lib/svgs";
import { cn } from "@/lib/utils";

type Update = {
  id: string;
  symbol: string;
  title: string;
  detail: string;
  at: number;
};
type DragHandlers = Parameters<typeof useDrag>[0];
type Axis = "x" | "y" | null;

// DEMO: sample updates so the list looks full. For real data, use
// api.checkpoints.recentFeed with describeFeedEvent for the title and detail.
const SAMPLE_UPDATES = [
  { symbol: "AAVE", title: "AAVE moved by 0.4%", detail: "AAVE at $131.40", minutesAgo: 1 },
  { symbol: "NEAR", title: "You took the lead on NEAR", detail: "NEAR at $2.41 (+1.2%)", minutesAgo: 3 },
  { symbol: "ARB", title: "ARB up 6.8% today", detail: "ARB at $0.1673", minutesAgo: 6 },
  { symbol: "NEAR", title: "NEAR is 75% of the way to $2.60", detail: "NEAR at $2.41", minutesAgo: 9 },
  { symbol: "AAVE", title: "AAVE hit a 24h high", detail: "AAVE at $131.40", minutesAgo: 14 },
  { symbol: "ARB", title: "Final stretch on ARB", detail: "You're ahead by 0.8%", minutesAgo: 22 },
];

const ROW_HEIGHT = 48;
// How far a row slides open to show its actions.
const ACTIONS_WIDTH = 119;
// A drag waits this long before deciding: mostly sideways swipes the row,
// anything else scrolls the list.
const LOCK_THRESHOLD = 10;
const SWIPE = springFromResponse(0.4, 1);
const BOUNCE = springFromResponse(0.5, 1);

function UpdateRow({
  update,
  now,
  isLast,
  scroll,
  onDelete,
}: {
  update: Update;
  now: number;
  isLast: boolean;
  // The list's scroll handlers, for drags that lock vertically
  scroll: DragHandlers;
  onDelete: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const originX = useRef(0);
  const axis = useRef<Axis>(null);
  const lockAt = useRef({ x: 0, y: 0 });

  const background = useTransform(
    x,
    [-ACTIONS_WIDTH, 0],
    ["#f8f8f8", "#ffffff"],
  );
  const actionScale = useTransform(x, [-ACTIONS_WIDTH, 0], [1, 0.8]);

  const drag = useDrag({
    onStart: (start) => {
      // Touching a row stops the list, like any iOS scroll view
      scroll.onStart?.(start);
      x.stop();
      originX.current = x.get();
      axis.current = null;
    },
    onMove: (delta) => {
      if (axis.current === null) {
        if (Math.hypot(delta.x, delta.y) < LOCK_THRESHOLD) return;
        axis.current = Math.abs(delta.x) > Math.abs(delta.y) ? "x" : "y";
        // Measure from here so nothing jumps by the 10px it took to decide
        lockAt.current = delta;
      }

      if (axis.current === "y") {
        scroll.onMove({ x: 0, y: delta.y - lockAt.current.y });
        return;
      }

      x.set(
        applyRubberBand(
          originX.current + delta.x - lockAt.current.x,
          -ACTIONS_WIDTH,
          0,
          rowRef.current!.clientWidth,
        ),
      );
    },
    onEnd: (velocity) => {
      // The list always gets its onEnd (it tracks dragging state), but only a
      // vertical drag hands it any speed
      scroll.onEnd?.(axis.current === "y" ? velocity : { x: 0, y: 0 });
      if (axis.current !== "x") return;

      const landing = x.get() + project(velocity.x);
      const target = landing < -ACTIONS_WIDTH / 2 ? -ACTIONS_WIDTH : 0;
      animate(x, target, { ...SWIPE, velocity: velocity.x });
    },
  });

  return (
    <div
      ref={rowRef}
      className={cn(
        "relative w-full overflow-hidden",
        !isLast && "border-b border-black/4",
      )}
      style={{ height: ROW_HEIGHT }}
    >
      {/* Sit behind the row, uncovered as it slides left. */}
      <motion.div
        style={{ scale: actionScale }}
        className="absolute top-1/2 right-4 -mt-4.5 flex origin-right gap-2"
      >
        <ActionButton
          label="Stake on this update"
          className="text-[#9ca2ff] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04),0px_0px_0px_1px_rgba(0,0,0,0.05),inset_0px_-0.5px_0.5px_0px_#d0d5ff,inset_0px_0.5px_0px_0px_#d0d5ff]"
        >
          <DollarIcon className="size-4.5" />
        </ActionButton>
        <ActionButton
          label="Delete update"
          className="text-[#e55767] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04),0px_0px_0px_1px_rgba(0,0,0,0.05),inset_1px_-1px_2px_0px_rgba(255,255,255,0.25),inset_0px_1px_3px_0px_white]"
          onClick={onDelete}
        >
          <TrashIcon className="size-4.5" />
        </ActionButton>
      </motion.div>

      <motion.div
        {...drag}
        style={{ x, backgroundColor: background }}
        className="relative z-10 flex h-full w-full cursor-grab touch-none items-center justify-between gap-4 px-6.5 select-none active:cursor-grabbing"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <RemoteImage
            src={getTokenImage(update.symbol)}
            alt={update.symbol}
            size={26}
            fallback={mainAssets.baseImage}
            className="shrink-0"
          />
          <div className="flex min-w-0 items-center gap-4 font-display text-sm leading-5 font-medium tracking-[-0.0046em]">
            <p className="max-w-60 shrink-0 truncate text-fg-base">
              {update.title}
            </p>
            <p className="min-w-0 truncate text-gray-12/55">{update.detail}</p>
          </div>
        </div>
        <p className="shrink-0 text-sm leading-5 font-medium tracking-[-0.0046em] text-gray-12/55">
          {formatTimeAgo(now - update.at)}
        </p>
      </motion.div>
    </div>
  );
}

function ActionButton({
  label,
  className,
  onClick,
  children,
}: {
  label: string;
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      // Keep the press from starting a row drag, which would capture the
      // pointer and swallow this button's click
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "flex size-9 cursor-pointer items-center justify-center rounded-md bg-[#f2f2f2]",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Home page updates, as a swipeable list (sample data for now). Swipe a row
 * left for its actions; drag or wheel to scroll, with momentum and rubber
 * banding at the ends.
 */
export function UpdatesTable({ className }: { className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  const [updates] = useState<Update[]>(() =>
    SAMPLE_UPDATES.map(({ minutesAgo, ...update }, index) => ({
      ...update,
      id: String(index),
      at: now - minutesAgo * 60_000,
    })),
  );
  // Deleting only hides a row for this visit; nothing is saved yet.
  const [deleted, setDeleted] = useState<ReadonlySet<string>>(new Set());

  const boundaryRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number>(null);
  const originY = useRef(0);
  const y = useMotionValue(0);

  // Keeps "2m ago" current.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const getMin = () =>
    Math.min(
      0,
      boundaryRef.current!.clientHeight - trackRef.current!.offsetHeight,
    );

  const stop = () => {
    if (frame.current) cancelAnimationFrame(frame.current);
    y.stop();
  };

  // Wheel and trackpad scrolling. Native listener: React's is passive, and
  // the page shouldn't scroll while the list still can.
  useEffect(() => {
    const boundary = boundaryRef.current;
    if (!boundary) return;

    function onWheel(e: WheelEvent) {
      const min = Math.min(
        0,
        boundaryRef.current!.clientHeight - trackRef.current!.offsetHeight,
      );
      const next = clamp(y.get() - e.deltaY, min, 0);
      if (next === y.get()) return;
      e.preventDefault();
      if (frame.current) cancelAnimationFrame(frame.current);
      y.stop();
      y.set(next);
    }

    boundary.addEventListener("wheel", onWheel, { passive: false });
    return () => boundary.removeEventListener("wheel", onWheel);
  }, [y]);

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const coast = (v0: number) => {
    const min = getMin();
    const p0 = y.get();
    const t0 = performance.now();
    const rate = DECELERATION.normal;
    const lnRate = Math.log(rate);

    const tick = () => {
      const t = performance.now() - t0;
      const decay = Math.pow(rate, t);
      const position = p0 + (v0 * (decay - 1)) / (1000 * lnRate);
      const velocity = v0 * decay;

      // Hit an edge mid-flight: hand the remaining speed to a spring so it bounces
      if (position > 0 || position < min) {
        const edge = clamp(position, min, 0);
        y.set(edge);
        animate(y, edge, { ...BOUNCE, velocity });
        return;
      }

      y.set(position);
      if (Math.abs(velocity) > 10) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
  };

  const scroll: DragHandlers = {
    onStart: () => {
      stop();
      originY.current = y.get();
    },
    onMove: (delta) => {
      y.set(
        applyRubberBand(
          originY.current + delta.y,
          getMin(),
          0,
          boundaryRef.current!.clientHeight,
        ),
      );
    },
    onEnd: (velocity) => {
      const min = getMin();
      const position = y.get();

      if (position > 0 || position < min) {
        animate(y, clamp(position, min, 0), {
          ...BOUNCE,
          velocity: velocity.y,
        });
        return;
      }

      coast(velocity.y);
    },
  };

  const visible = updates.filter((update) => !deleted.has(update.id));

  return (
    <section className={cn("flex min-w-0 flex-col gap-4.5", className)}>
      <div className="flex h-8 items-center justify-between">
        <h2 className="text-sm leading-5 font-medium tracking-[-0.0046em] text-fg-base">
          Updates
        </h2>
        <Link
          href={AppRoutes.feed.path}
          className="rounded-md bg-[#f2f2f2] px-2 py-1.5 text-caption leading-5 tracking-[-0.0046em] text-fg-base shadow-[0px_4px_16px_0px_rgba(0,0,0,0.04),0px_0px_0px_1px_rgba(0,0,0,0.05)] outline-none hover:bg-gray-4 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          All Updates
        </Link>
      </div>

      <div
        ref={boundaryRef}
        className="relative min-h-60.75 flex-1 overflow-hidden rounded-xl bg-card"
      >
        {visible.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-12/55">
            No updates yet.
          </p>
        )}

        <motion.div ref={trackRef} style={{ y }} className="w-full">
          <AnimatePresence
            initial={false}
            onExitComplete={() => {
              animate(y, clamp(y.get(), getMin(), 0), BOUNCE);
            }}
          >
            {visible.map((update, index) => (
              <motion.div
                key={update.id}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: ROW_HEIGHT, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={SWIPE}
                className="overflow-hidden"
              >
                <UpdateRow
                  update={update}
                  now={now}
                  isLast={index === visible.length - 1}
                  scroll={scroll}
                  onDelete={() =>
                    setDeleted((prev) => new Set(prev).add(update.id))
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
