"use client";

import { AaveIcon, BaseIcon, OptimismIcon } from "@/lib/svgs";
import { motion, useTransform } from "motion/react";
import { usePullTrigger } from "@/hooks/use-pull-trigger";
import { cn } from "@/lib/utils";
import { barVariants, stackVariants, tokenVariants } from "@/lib/variants";
import { Ticket, TICKET_BODY_WIDTH } from "@/components/ticket/ticket";
import { useState } from "react";

const tokenData = [
  { id: 1, icon: <AaveIcon /> },
  { id: 2, icon: <BaseIcon /> },
  { id: 3, icon: <OptimismIcon /> },
];

const TOKEN_OFFSET = 34;
const TOKEN_SIZE = 64;
// Pull (px) on the bar, released past this, toggles the ticket
const PULL_TRIGGER = 24;
// Furthest the bar moves, however far it is dragged
const PULL_MAX = 40;
// How far the centre bends ahead of the ends, as a fraction of the move (max 12px)
const BEND_RATIO = 0.3;
// Bar geometry: an 8px-thick, 42px-tall stroke with round caps
const BAR_THICKNESS = 8;
const BAR_HEIGHT = 42;
const BAR_CAP = BAR_THICKNESS / 2;
// Quadratic curve from cap to cap. The curve's midpoint sits halfway to its control
// point, so the control is pushed out 2x the bend to move the centre by `bend` px.
const barPath = (pull: number) => {
  const bend = pull * BEND_RATIO;
  return `M${BAR_CAP} ${BAR_CAP}Q${BAR_CAP + bend * 2} ${BAR_HEIGHT / 2} ${BAR_CAP} ${BAR_HEIGHT - BAR_CAP}`;
};

// Token spacing at which the tiles span exactly the body's width (34 -> 37px)
const SPREAD_OFFSET =
  (TICKET_BODY_WIDTH - TOKEN_SIZE) / (tokenData.length - 1) - TOKEN_OFFSET;

export const TicketPull = () => {
  const [open, setOpen] = useState(false);

  const { pull, dragging, handlers } = usePullTrigger({
    onTrigger: () => setOpen((prev) => !prev),
    max: PULL_MAX,
    threshold: PULL_TRIGGER,
  });
  const barD = useTransform(pull, barPath);

  return (
    <motion.div
      className="group relative h-16 w-51"
      initial={false}
      animate={open ? "open" : "closed"}
    >
      <motion.div className="absolute inset-0 z-0" variants={stackVariants}>
        {tokenData.map((token, i) => (
          <motion.div
            key={token.id}
            className="absolute top-0"
            style={{
              left: i * TOKEN_OFFSET,
              zIndex: tokenData.length - i,
            }}
            custom={i * SPREAD_OFFSET}
            variants={tokenVariants}
          >
            {token.icon}
          </motion.div>
        ))}
      </motion.div>

      <Ticket open={open} className="absolute top-0 left-0 z-10" />

      <motion.button
        type="button"
        aria-expanded={open}
        aria-label={
          open ? "Pull to put the early pass away" : "Pull to reveal early pass"
        }
        // Hidden until the pointer enters the interaction (or it has keyboard focus).
        // Always shown on touch screens, which have no hover to reveal it.
        className={cn(
          "absolute top-2.75 z-40 h-10.5 w-2 cursor-grab touch-pan-y rounded-[30px] opacity-0 outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#ff5b00]/50 active:cursor-grabbing pointer-coarse:opacity-100",
          dragging && "opacity-100",
        )}
        style={{ x: pull }}
        variants={barVariants}
        {...handlers}
      >
        {/* The bar is drawn as a stroke so its centre can bend ahead of the ends */}
        <svg
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          width={BAR_THICKNESS}
          height={BAR_HEIGHT}
          fill="none"
        >
          <motion.path
            d={barD}
            stroke="var(--landing-pull-bar)"
            strokeWidth={BAR_THICKNESS}
            strokeLinecap="round"
          />
        </svg>
      </motion.button>
    </motion.div>
  );
};
