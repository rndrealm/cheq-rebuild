"use client";

import {
  AaveIcon,
  BaseIcon,
  LANDING_AVATAR_FACE_PATH,
  LANDING_AVATAR_PATH,
  OptimismIcon,
} from "@/lib/svgs";
import {
  animate,
  motion,
  type MotionValue,
  useMotionValue,
  useTransform,
} from "motion/react";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import { usePullTrigger } from "@/hooks/use-pull-trigger";
import { cn } from "@/lib/utils";
import {
  avatarVariants,
  barVariants,
  bodyVariants,
  EASE_OUT,
  stackVariants,
  STUB_OPEN,
  STUB_WIDTH,
  stubVariants,
  textVariants,
  tokenVariants,
} from "@/lib/variants";
import React, { useEffect, useRef, useState } from "react";

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

const BODY_HEIGHT = 64;
const BODY_WIDTH = 138;

// Cut-out: a window through the ticket body onto a floor below, with the avatar
// sitting on the floor. Window geometry matches Figma (4px frame, 69x56 hole).
const WINDOW_INSET = 4;
const WINDOW_WIDTH = 69;
const WINDOW_HEIGHT = 56;
const WINDOW_RADIUS = 12;
// Themed (globals.css): a shade off the page background, so it reads as a floor
const FLOOR_COLOR = "var(--landing-cutout)";
// Inner walls of the cut-out, seen on the far side as the ticket tilts. Lit from
// above: the bottom wall faces the light, the top wall faces away from it.
const WALL_TOP = "#b84200";
const WALL_SIDE = "#e04f00";
const WALL_BOTTOM = "#ff8a3d";
// Small enough to leave floor visible on every side at full tilt
const RECESSED_AVATAR_SIZE = 32;
// How far below the ticket's surface the floor sits
const AVATAR_DEPTH = 10; // px

// Body-sized clip with the window punched out, shared by the body and its glare.
// A clip-path rather than a mask: masks get rasterised blurry inside the 3D tilt.
const WINDOW_CLIP = (() => {
  const [x, y, w, h, r] = [
    WINDOW_INSET,
    WINDOW_INSET,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    WINDOW_RADIUS,
  ];
  const hole = `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  return `path(evenodd, "M0 0H${BODY_WIDTH}V${BODY_HEIGHT}H0Z${hole}")`;
})();
const windowMaskStyle = { clipPath: WINDOW_CLIP };
// Token spacing at which the tiles span exactly the body's width (34 -> 37px)
const SPREAD_OFFSET =
  (BODY_WIDTH - TOKEN_SIZE) / (tokenData.length - 1) - TOKEN_OFFSET;

// Mouse follow: the ticket tilts to face the cursor
const TILT_MAX = 20; // deg
// Cursor distance from the ticket's centre that gives full tilt
const FOLLOW_RANGE = 300;
// Lower = stronger 3D foreshortening as it tilts
const TILT_PERSPECTIVE = 400;
const TILT_SPRING = { stiffness: 150, damping: 18 };

// Glare: holographic bands whose position, angle and strength follow the tilt
const TICKET_WIDTH = BODY_WIDTH + STUB_WIDTH;
const GLARE_WIDTH = 60;
// Main band's left edge as tilt goes -1..1: its centre runs edge to edge, so it never leaves
const GLARE_TRAVEL = [-GLARE_WIDTH / 2, TICKET_WIDTH - GLARE_WIDTH / 2];
const GLARE_ANGLE = 20; // deg, swung up to ±10 more by vertical tilt
// Opacity when flat, rising to the max at full tilt
const GLARE_MIN = 0.08;
const GLARE_MAX = 0.4;

// Each band rides the main glare position at its own speed and offset, so they
// fan apart and cross over as the ticket tilts, like holographic foil
const GLARE_BANDS = [
  { color: "#ffffff", width: GLARE_WIDTH, offset: 0, speed: 1, strength: 1 },
  { color: "#7df9ff", width: 22, offset: -77, speed: 1.7, strength: 1.4 },
  { color: "#ff6ec7", width: 34, offset: 88, speed: 0.45, strength: 1.3 },
  { color: "#c6ff5e", width: 14, offset: 76, speed: 1.4, strength: 1.5 },
  { color: "#9d8cff", width: 28, offset: -12, speed: 0.2, strength: 1.2 },
];

type GlareBandConfig = (typeof GLARE_BANDS)[number];

const GlareBand = ({
  band,
  position,
  shift = 0,
  rotate,
  opacity,
}: {
  band: GlareBandConfig;
  // Main glare position across the whole ticket
  position: MotionValue<number>;
  // Where this layer starts along the ticket, so bands line up across body and stub
  shift?: number;
  rotate: MotionValue<number>;
  opacity: MotionValue<number>;
}) => {
  const x = useTransform(position, (v) => v * band.speed + band.offset - shift);
  const bandOpacity = useTransform(opacity, (v) =>
    Math.min(1, v * band.strength),
  );

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute -top-1/2 left-0 h-[200%]"
      style={{
        width: band.width,
        backgroundImage: `linear-gradient(90deg, transparent, ${band.color}, transparent)`,
        x,
        rotate,
        opacity: bandOpacity,
      }}
    />
  );
};

const GlareBands = (props: Omit<Parameters<typeof GlareBand>[0], "band">) =>
  GLARE_BANDS.map((band) => (
    <GlareBand key={band.color} band={band} {...props} />
  ));

// Top and bottom walls: each a strip along its edge, scaled to the depth showing.
// Scaled rather than resized so every frame stays on the compositor.
const WallStrip = ({
  edge,
  scale,
}: {
  edge: "top" | "bottom";
  scale: MotionValue<number>;
}) => (
  <motion.div
    className={cn(
      "absolute inset-x-0",
      edge === "top" ? "top-0 origin-top" : "bottom-0 origin-bottom",
    )}
    style={{
      height: AVATAR_DEPTH,
      backgroundColor: edge === "top" ? WALL_TOP : WALL_BOTTOM,
      scaleY: scale,
    }}
  />
);

// The cut-out seen through the window. The floor (with the avatar on it) slides by
// the recess offset, uncovering the walls behind it on the far side: the side walls
// are the well's own colour, the top/bottom walls are strips that grow with the shift.
// All transforms, so the tilt never triggers a repaint.
const TicketRecess = ({
  x,
  y,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
}) => {
  const topWall = useTransform(y, (v) => Math.max(0, v) / AVATAR_DEPTH);
  const bottomWall = useTransform(y, (v) => Math.max(0, -v) / AVATAR_DEPTH);

  return (
    <motion.div
      aria-hidden
      className="absolute overflow-hidden"
      style={{
        top: WINDOW_INSET,
        left: WINDOW_INSET,
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        borderRadius: WINDOW_RADIUS,
        backgroundColor: WALL_SIDE,
      }}
      variants={bodyVariants}
    >
      <WallStrip edge="top" scale={topWall} />
      <WallStrip edge="bottom" scale={bottomWall} />
      {/* Soft rim shadow removed for now. To restore, overlay a static div on the
          window with box-shadow: inset 0 3px 5px rgba(0,0,0,0.3), inset 0 0 2px rgba(0,0,0,0.25) */}
      <motion.div
        className="absolute inset-0"
        style={{
          borderRadius: WINDOW_RADIUS,
          backgroundColor: FLOOR_COLOR,
          x,
          y,
        }}
      >
        <motion.svg
          className="absolute"
          style={{
            top: (WINDOW_HEIGHT - RECESSED_AVATAR_SIZE) / 2,
            left: (WINDOW_WIDTH - RECESSED_AVATAR_SIZE) / 2,
          }}
          width={RECESSED_AVATAR_SIZE}
          height={RECESSED_AVATAR_SIZE}
          // Cropped to the glyph's own 40x40 bounds (it sits at 12,12 in the 64 icon)
          viewBox="12 12 40 40"
          fill="none"
          variants={avatarVariants}
        >
          {/* The face is a hole in the outline, filled with its own themed colour
              (globals.css) rather than showing the floor. Eyes are part of the
              outline path. */}
          <path d={LANDING_AVATAR_FACE_PATH} fill="var(--landing-ticket-face)" />
          <path d={LANDING_AVATAR_PATH} fill="#00a4ff" />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
};

const VerticalText = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "block rotate-180 whitespace-nowrap leading-1.75 [writing-mode:vertical-rl]",
      className,
    )}
  >
    {children}
  </span>
);

export const TicketPull = () => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { pull, dragging, handlers } = usePullTrigger({
    onTrigger: () => setOpen((prev) => !prev),
    max: PULL_MAX,
    threshold: PULL_TRIGGER,
  });
  const barD = useTransform(pull, barPath);

  // The root doesn't rotate (its tilt wrapper does), and spans the bar too, so the
  // centre is set to the ticket's own
  const { tiltX, tiltY, rotateX, rotateY } = usePointerTilt(rootRef, {
    enabled: open,
    range: FOLLOW_RANGE,
    max: TILT_MAX,
    spring: TILT_SPRING,
    centreX: TICKET_WIDTH / 2,
  });
  // Where a point AVATAR_DEPTH behind the surface lands under the current tilt.
  // Done as a flat offset rather than real 3D (preserve-3d), which Chrome rasterises
  // blurry under perspective.
  const toRad = Math.PI / 180;
  const recessX = useTransform(
    rotateY,
    (deg) => -AVATAR_DEPTH * Math.sin(deg * toRad),
  );
  const recessY = useTransform(
    rotateX,
    (deg) => AVATAR_DEPTH * Math.sin(deg * toRad),
  );

  // Extra offset for the one-off sweep as the ticket opens
  const glareSweep = useMotionValue(0);
  const glareX = useTransform(
    [tiltX, glareSweep],
    ([tilt, sweep]: number[]) =>
      GLARE_TRAVEL[0] +
      ((tilt + 1) / 2) * (GLARE_TRAVEL[1] - GLARE_TRAVEL[0]) +
      sweep,
  );
  const glareRotate = useTransform(tiltY, (v) => GLARE_ANGLE + v * 10);
  const glareOpacity = useTransform(
    [tiltX, tiltY],
    ([x, y]: number[]) =>
      GLARE_MIN + (GLARE_MAX - GLARE_MIN) * Math.min(1, Math.hypot(x, y)),
  );

  useEffect(() => {
    if (!open) return;
    // Glides in from off the left and settles where the tilt puts it
    const sweep = animate(glareSweep, [-(TICKET_WIDTH + GLARE_WIDTH), 0], {
      duration: 0.9,
      delay: STUB_OPEN + 0.1,
      ease: EASE_OUT,
    });
    return () => sweep.stop();
  }, [open, glareSweep]);

  return (
    <motion.div
      ref={rootRef}
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

      {/* Body, avatar and stub tilt together as one ticket */}
      <motion.div
        className="absolute top-0 left-0 z-10 h-16 w-45"
        style={{ rotateX, rotateY, transformPerspective: TILT_PERSPECTIVE }}
      >
        {/* Painted first, so the body's frame sits over it around the window */}
        <TicketRecess x={recessX} y={recessY} />

        <motion.div
          aria-hidden={!open}
          className="absolute top-0 left-0 z-20 h-16 w-34.5 rounded-[14px] bg-[#ff5b00] font-medium text-[7px] tracking-[-0.168px]"
          style={windowMaskStyle}
          variants={bodyVariants}
        >
          <motion.div
            className="absolute top-1 left-19 flex flex-col gap-4.5 text-white"
            variants={textVariants}
          >
            <VerticalText className="h-1.75">01</VerticalText>
            <VerticalText className="h-7.75">Early pass</VerticalText>
          </motion.div>
          <motion.div
            className="absolute top-1 left-22 flex h-14 flex-col justify-between"
            variants={textVariants}
          >
            <VerticalText className="h-1.75 text-[#010101]">12</VerticalText>
            {/* Wraps at its 41px length like Figma: "cheq easter" / "egg" */}
            <VerticalText className="h-10.25 whitespace-normal text-white">
              cheq easter egg
            </VerticalText>
          </motion.div>
        </motion.div>

        {/* Glare on the body's surface only: clipped to its shape and skipping the window */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-40 h-16 w-34.5 overflow-hidden rounded-[14px]"
          style={windowMaskStyle}
          variants={bodyVariants}
        >
          <GlareBands
            position={glareX}
            rotate={glareRotate}
            opacity={glareOpacity}
          />
        </motion.div>

        <motion.div
          aria-hidden={!open}
          className="absolute top-0 left-34.5 z-10 h-16 overflow-hidden rounded-[14px] bg-[#ff5b00] font-medium text-[7px] leading-1.75 tracking-[-0.168px]"
          variants={stubVariants}
        >
          <motion.div
            className="absolute top-1.25 left-1.25 flex w-4.25 flex-col gap-1 text-white"
            variants={textVariants}
          >
            <span>
              Early
              <br />
              pass
            </span>
            <span>01</span>
          </motion.div>
          <motion.span
            className="absolute top-13 left-1.5 text-[#0b0b0b]"
            variants={textVariants}
          >
            12
          </motion.span>
          {/* The stub sits BODY_WIDTH along, so its bands shift back to line up */}
          <GlareBands
            position={glareX}
            shift={BODY_WIDTH}
            rotate={glareRotate}
            opacity={glareOpacity}
          />
        </motion.div>
      </motion.div>

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
