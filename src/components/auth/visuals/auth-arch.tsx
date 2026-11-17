"use client";

import { useEffect, useState } from "react";
import { motion, type Variants } from "motion/react";
import {
  Ticket,
  TICKET_BODY_HEIGHT,
  TICKET_BODY_WIDTH,
  TICKET_WINDOW_AVATAR_SIZE,
} from "@/components/ticket/ticket";
import { AvatarGlyph } from "@/components/avatar";
import { EASE_OUT, EASE_SPREAD, SWAP_CLOSE, SWAP_OPEN } from "@/lib/variants";
import { INTRO } from "@/components/auth/visuals/intro";

const ARCH_WIDTH = 680;
const ARCH_HEIGHT = 149;
const TILE_SIZE = 80;
// Corner radius of a full-size tile (scales with it: 14px at ticket size)
const TILE_RADIUS = 17.5;
// The white avatar glyph, centred on the tile
const GLYPH_SIZE = 50;

// --- Tiles -----------------------------------------------------------------
// Drawn from the Figma tile assets: a vertical gradient (which starts above the
// tile and runs past its bottom, so only part of it shows), a glow in the
// tile's colour under it, and the white avatar glyph. Left to right.
type TileStyle = {
  // Gradient start (px from the tile's top; negative is above it), length, and
  // stops as [offset 0..1, colour]
  from: number;
  length: number;
  stops: [number, string][];
  // Glow colour (r, g, b); shown at 40%
  glow: [number, number, number];
};

// Most tiles share one gradient frame (Figma: y -18..157 on a 90px canvas
// with the tile at y 2)
const STANDARD = { from: -20, length: 175 };

const TILES: TileStyle[] = [
  {
    // indigo
    ...STANDARD,
    stops: [[0, "#B5C5FF"], [0.16, "#91A0FB"], [0.63, "#7E8DF9"], [1, "#6C7AF7"]],
    glow: [190, 164, 255],
  },
  {
    // lavender
    ...STANDARD,
    stops: [[0, "#DDCEFF"], [0.16, "#CEB9FF"], [0.63, "#C6AFFF"], [1, "#BEA4FF"]],
    glow: [190, 164, 255],
  },
  {
    // blue
    ...STANDARD,
    stops: [
      [0, "#93CEFF"],
      [0.3256, "#3FA6F9"],
      [0.406, "#3FA6F9"],
      [0.6874, "#048AF5"],
      [1, "#048AF5"],
    ],
    glow: [4, 138, 245],
  },
  {
    // green (centre)
    from: -11.5,
    length: 166.5,
    stops: [[0, "#7EEB84"], [0.1638, "#78E07E"], [0.6269, "#67C26C"], [1, "#5EB263"]],
    glow: [123, 230, 129],
  },
  {
    // yellow
    ...STANDARD,
    stops: [[0, "#FFE281"], [0.16, "#F9D241"], [0.63, "#F6CA20"], [1, "#F4C300"]],
    glow: [244, 195, 0],
  },
  {
    // orange
    ...STANDARD,
    stops: [[0, "#FFCC9A"], [0.16, "#FFB676"], [0.63, "#FFAC64"], [1, "#FFA152"]],
    glow: [255, 161, 82],
  },
  {
    // lime
    ...STANDARD,
    stops: [[0, "#D2EA81"], [0.16, "#B1CD40"], [0.63, "#A1BE20"], [1, "#91AF00"]],
    glow: [210, 234, 129],
  },
];

const gradientCss = ({ from, length, stops }: TileStyle) =>
  `linear-gradient(180deg, ${stops
    .map(([offset, colour]) => `${colour} ${from + offset * length}px`)
    .join(", ")})`;

// Figma: 1px spread, 3px down, Gaussian sigma 2 (a 4px CSS blur)
const glowShadow = ([r, g, b]: TileStyle["glow"], alpha: number) =>
  `0px 3px 4px 1px rgba(${r}, ${g}, ${b}, ${alpha})`;

// --- Arc -------------------------------------------------------------------
// The tiles sit at equal angles along a circle through the centre tile, with
// the outer two ARC_HALF_WIDTH to each side and ARC_DROP lower. Positions are
// tile centres, relative to the arch box.
const ARC_HALF_WIDTH = 300;
const ARC_DROP = ARCH_HEIGHT - TILE_SIZE; // the outer tiles sit on the box's floor
// The circle through (0, 0) and (±ARC_HALF_WIDTH, ARC_DROP)
const ARC_RADIUS = (ARC_HALF_WIDTH ** 2 + ARC_DROP ** 2) / (2 * ARC_DROP);
const CENTRE_TILE = (TILES.length - 1) / 2;
const ARC_STEP = Math.asin(ARC_HALF_WIDTH / ARC_RADIUS) / CENTRE_TILE;

const arcCentre = (i: number) => {
  const angle = (i - CENTRE_TILE) * ARC_STEP;
  return {
    x: ARCH_WIDTH / 2 + ARC_RADIUS * Math.sin(angle),
    y: TILE_SIZE / 2 + ARC_RADIUS * (1 - Math.cos(angle)),
  };
};

// --- Rows (username and password steps) ------------------------------------
// A row of five 30px slots, 38px apart (Figma: 626..808 x 197..227 on the
// page, i.e. 246.., 33 in the arch box). The inner five tiles fill the slots;
// the two outer ones fold into the end slots and fade.
const ROW_SLOT = 30;
const ROW_LEFT = 246;
const ROW_TOP = 33;
const ROW_GAP = 38; // left edge to left edge
const ROW_COUNT = 5;

const rowCentre = (slot: number) => ({
  x: ROW_LEFT + slot * ROW_GAP + ROW_SLOT / 2,
  y: ROW_TOP + ROW_SLOT / 2,
});

// Username: only the glyph shows, at the slot's size (the 30px glass avatar)
const AVATAR_SCALE = ROW_SLOT / GLYPH_SIZE;
// Password: the whole coloured tile at the slot's size
const DOT_SCALE = ROW_SLOT / TILE_SIZE;

// --- Ticket ----------------------------------------------------------------
// Where the ticket sits inside the arch box on sign-up's welcome step (Figma
// "Welcome to Cheq": 631,368 on the page, with the arch box at 380,164). It
// sits under the heading, so it hangs below the box, which is fine.
const TICKET_LEFT = 251;
const TICKET_TOP = 204;

// The tiles gather into the ticket body's footprint, overlapping evenly across
// its width, so they hand over to the body size-for-size (as TicketPull's
// tokens do)
const SLOT = (TICKET_BODY_WIDTH - TICKET_BODY_HEIGHT) / (TILES.length - 1);
const TICKET_SCALE = TICKET_BODY_HEIGHT / TILE_SIZE;

const ticketCentre = (i: number) => ({
  x: TICKET_LEFT + i * SLOT + TICKET_BODY_HEIGHT / 2,
  y: TICKET_TOP + TICKET_BODY_HEIGHT / 2,
});

// How long the tiles take to move between arch, rows and ticket
const MOVE = 0.6;

// --- Motion ----------------------------------------------------------------
// Each tile moves as one (position, scale, glow), and swaps what it shows
// through layers that fade per mode: its gradient, the white glyph, the glass
// glyph, and the orange it turns on its way into the ticket.

type TileTargets = {
  style: TileStyle;
  // Offsets from the tile's arch position
  row: { x: number; y: number; visible: boolean };
  ticket: { x: number; y: number };
};

const inRow = (row: TileTargets["row"], scale: number, glow: string) => ({
  x: row.x,
  y: row.y,
  scale,
  boxShadow: glow,
  opacity: row.visible ? 1 : 0,
  transition: {
    duration: MOVE,
    ease: EASE_SPREAD,
    // The outer two fade as they fold in; the rest only need to reappear
    // (instantly, as the ticket body goes) when coming back from the ticket
    opacity: row.visible
      ? { duration: 0, delay: SWAP_CLOSE }
      : { duration: MOVE / 2 },
  },
});

const tileVariants: Variants = {
  arch: ({ style }: TileTargets) => ({
    x: 0,
    y: 0,
    scale: 1,
    boxShadow: glowShadow(style.glow, 0.4),
    opacity: 1,
    // Coming back from the ticket, reappear as its body disappears
    transition: {
      duration: MOVE,
      delay: SWAP_CLOSE,
      ease: EASE_SPREAD,
      opacity: { duration: 0, delay: SWAP_CLOSE },
    },
  }),
  avatars: ({ style, row }: TileTargets) =>
    inRow(row, AVATAR_SCALE, glowShadow(style.glow, 0)),
  dots: ({ style, row }: TileTargets) =>
    inRow(row, DOT_SCALE, glowShadow(style.glow, 0.4)),
  // Fly into the ticket's footprint, vanishing the moment they land, which is
  // when the ticket body appears
  welcome: ({ style, ticket }: TileTargets) => ({
    ...ticket,
    scale: TICKET_SCALE,
    boxShadow: glowShadow(style.glow, 0),
    opacity: 0,
    transition: {
      duration: MOVE,
      ease: EASE_SPREAD,
      opacity: { duration: 0, delay: MOVE },
    },
  }),
};

const fade = (shown: boolean) => ({
  opacity: shown ? 1 : 0,
  transition: { duration: MOVE / 2, delay: shown ? MOVE / 3 : 0 },
});

// The tile's own gradient: the arch and the password dots
const fillVariants: Variants = {
  arch: fade(true),
  dots: fade(true),
  avatars: fade(false),
  welcome: fade(false),
};
// The orange it turns while flying into the ticket
const orangeVariants: Variants = {
  arch: fade(false),
  dots: fade(false),
  avatars: fade(false),
  welcome: { opacity: 1, transition: { duration: MOVE * 0.8 } },
};
// The avatar: solid white on the coloured tile, 16% white glass on its own
// for the username step (Figma). One avatar throughout, so its expression
// carries on across the change.
const glyphVariants: Variants = {
  arch: fade(true),
  dots: fade(true),
  avatars: { opacity: 0.16, transition: { duration: MOVE / 2 } },
  welcome: fade(false),
};

// Each tile's expression (indices into EXPRESSIONS: 0 circles, 1 vertical,
// 2 diagonal, 3 curved, 4 chevron) on the email step. Chevron reads as cross,
// so it's left out. Every step change moves each tile on to the next one in
// this list, so they react together as the user goes.
const TILE_EXPRESSIONS = [0, 3, 1, 3, 2, 0, 1];
const MODE_SHIFT: Record<AuthArchMode, number> = {
  arch: 0,
  avatars: 1,
  dots: 2,
  welcome: 0,
};
const expressionFor = (tile: number, mode: AuthArchMode) =>
  TILE_EXPRESSIONS[(tile + MODE_SHIFT[mode]) % TILE_EXPRESSIONS.length];
// Staggers the idle loops (blinks etc.) so the tiles don't move in unison
const idleDelayFor = (tile: number) => (tile * 0.37) % 1.3;

export type AuthArchMode = "arch" | "avatars" | "dots" | "welcome";

/**
 * The avatar tiles above the auth screens' heading:
 * - "arch": seven coloured avatar tiles along an arc (email step)
 * - "avatars": five glass avatars in a row (username step)
 * - "dots": five small coloured avatar tiles in the same row (password step)
 * - "welcome": the tiles fly together, turn orange and hand over to the
 *   early-pass ticket under the heading, with the indigo avatar tile in its
 *   window (sign-up's welcome step)
 */
export function AuthArch({ mode }: { mode: AuthArchMode }) {
  const ticket = mode === "welcome";
  const [ticketOpen, setTicketOpen] = useState(false);

  // Start opening the ticket so its body appears (SWAP_OPEN in) exactly as the
  // tiles land. Closing starts straight away; the tiles wait for it.
  useEffect(() => {
    const id = setTimeout(
      () => setTicketOpen(ticket),
      ticket ? (MOVE - SWAP_OPEN) * 1000 : 0,
    );
    return () => clearTimeout(id);
  }, [ticket]);

  return (
    <div
      className="relative shrink-0 max-sm:-my-9 max-sm:scale-[0.5]"
      style={{ width: ARCH_WIDTH, height: ARCH_HEIGHT }}
    >
      {TILES.map((style, i) => {
        const home = arcCentre(i);
        const slot = Math.min(Math.max(i - 1, 0), ROW_COUNT - 1);
        const row = rowCentre(slot);
        const tick = ticketCentre(i);
        const targets: TileTargets = {
          style,
          row: {
            x: row.x - home.x,
            y: row.y - home.y,
            visible: i >= 1 && i <= ROW_COUNT,
          },
          ticket: { x: tick.x - home.x, y: tick.y - home.y },
        };

        // Entrance: drop in from above and a little toward the centre. x settles
        // faster than y, so each tile lands along a curve rather than a straight
        // line, and they start from the centre outward so the arch unfolds.
        const offset = home.x - ARCH_WIDTH / 2;
        const introDelay =
          INTRO.tiles + Math.abs(i - CENTRE_TILE) * INTRO.tileStagger;

        return (
          <motion.div
            key={i}
            aria-hidden
            className="absolute"
            style={{
              left: home.x - TILE_SIZE / 2,
              top: home.y - TILE_SIZE / 2,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
            initial={{ opacity: 0, x: -offset * 0.2, y: -48 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{
              delay: introDelay,
              opacity: { duration: 0.5, delay: introDelay, ease: EASE_OUT },
              x: { duration: 0.6, delay: introDelay, ease: EASE_OUT },
              y: { duration: 0.9, delay: introDelay, ease: EASE_OUT },
            }}
          >
            {/* Idle drift once landed */}
            <TileFloat index={i} mode={mode} delay={introDelay + 0.9}>
            {/* Its own variant root, so the wrappers above can't interfere
                with the arch/row/ticket moves. Scales about its centre, so
                row and ticket targets are centre to centre. */}
            <motion.div
              className="relative size-full"
              style={{ borderRadius: TILE_RADIUS }}
              initial={false}
              animate={mode}
              custom={targets}
              variants={tileVariants}
            >
              <motion.div
                className="absolute inset-0"
                style={{ borderRadius: TILE_RADIUS, backgroundImage: gradientCss(style) }}
                variants={fillVariants}
              />
              <motion.div
                className="absolute inset-0 bg-[#ff5b00]"
                style={{ borderRadius: TILE_RADIUS }}
                variants={orangeVariants}
              />
              <Glyph variants={glyphVariants}>
                {/* Figma: a white shadow 4px under the glyph, sigma 2 */}
                <AvatarGlyph
                  expressionIndex={expressionFor(i, mode)}
                  idleDelay={INTRO.tiles + idleDelayFor(i)}
                  className="size-full text-white drop-shadow-[0_4px_4px_rgba(255,255,255,0.25)]"
                />
              </Glyph>
            </motion.div>
            </TileFloat>
          </motion.div>
        );
      })}

      <Ticket
        open={ticketOpen}
        cutout="through"
        className="absolute"
        style={{ left: TICKET_LEFT, top: TICKET_TOP }}
        // Figma's welcome ticket shows the indigo avatar tile in its window
        windowAvatar={<AvatarTile size={TICKET_WINDOW_AVATAR_SIZE} />}
      />

      {/* Softens the ends of the arc on the email step */}
      <EdgeBlur side="left" shown={mode === "arch"} />
      <EdgeBlur side="right" shown={mode === "arch"} />
    </div>
  );
}

// --- Progressive edge blur ---------------------------------------------------
// Each end of the arc sits under a stack of backdrop-blur layers, each a step
// stronger than the last and masked to its own band, so the blur builds from
// nothing at the zone's inner edge to full strength at the outer tile.
//
// Smoothness comes from three things: small steps between layers (x1.6, not
// x2), wide overlaps (each layer fades over two bands either side of its
// peak), and S-curve mask fades (linear fades leave a faint visible edge where
// they start and stop).
//
// The blur ramps up over EDGE_BLUR_RAMP, then holds at full strength for
// EDGE_BLUR_OVERHANG past the arch's outer edge. A backdrop blur stops dead at
// its box, so the box has to end over plain background (where blur changes
// nothing), well clear of the outer tile and its glow.
const EDGE_BLUR_RAMP = 220;
const EDGE_BLUR_OVERHANG = 100;
const EDGE_BLUR_WIDTH = EDGE_BLUR_RAMP + EDGE_BLUR_OVERHANG;
const EDGE_BLUR_MIN = 0.25; // px, the first layer
const EDGE_BLUR_MAX = 16; // px, the last layer
const EDGE_BLUR_STEPS = 10;
const EDGE_BLUR_LAYERS = Array.from(
  { length: EDGE_BLUR_STEPS },
  (_, i) =>
    EDGE_BLUR_MIN * (EDGE_BLUR_MAX / EDGE_BLUR_MIN) ** (i / (EDGE_BLUR_STEPS - 1)),
);

// Same idea vertically: the zone runs well above the arch (tiles drop in from
// above during the entrance) and below the outer tiles' glow, and fades in and
// out over plain background only
const EDGE_BLUR_TOP = -100;
const EDGE_BLUR_HEIGHT = ARCH_HEIGHT + 200; // to 100px below the arch
const EDGE_BLUR_FADE = 80;

// Mask stops easing along an S-curve (smoothstep) from `fromAlpha` at `from`
// px to `toAlpha` at `to` px
const easedStops = (
  from: number,
  to: number,
  fromAlpha: number,
  toAlpha: number,
  steps = 8,
) =>
  Array.from({ length: steps + 1 }, (_, k) => {
    const t = k / steps;
    const eased = t * t * (3 - 2 * t);
    const alpha = fromAlpha + (toAlpha - fromAlpha) * eased;
    return `rgba(0,0,0,${alpha.toFixed(3)}) ${(from + (to - from) * t).toFixed(1)}px`;
  });

const EDGE_BLUR_VERTICAL = `linear-gradient(to bottom, ${[
  ...easedStops(0, EDGE_BLUR_FADE, 0, 1),
  ...easedStops(EDGE_BLUR_HEIGHT - EDGE_BLUR_FADE, EDGE_BLUR_HEIGHT, 1, 0),
].join(", ")})`;

function EdgeBlur({ side, shown }: { side: "left" | "right"; shown: boolean }) {
  // Towards the outer edge: 0px is the zone's inner edge
  const outward = side === "left" ? "to left" : "to right";
  const band = EDGE_BLUR_RAMP / EDGE_BLUR_LAYERS.length;
  // How far each layer fades in before its peak and out after it
  const overlap = band * 2;

  return EDGE_BLUR_LAYERS.map((blur, i) => {
    // Layer i peaks one band further out than the one before; the strongest
    // holds from its peak to the outer edge
    const last = i === EDGE_BLUR_LAYERS.length - 1;
    const peak = (i + 1) * band;
    const stops = last
      ? easedStops(peak - overlap, peak, 0, 1)
      : [
          ...easedStops(peak - overlap, peak, 0, 1),
          ...easedStops(peak, peak + overlap, 1, 0),
        ];
    const horizontal = `linear-gradient(${outward}, ${stops.join(", ")})`;
    const mask = `${horizontal}, ${EDGE_BLUR_VERTICAL}`;

    return (
      <motion.div
        key={blur}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          // Hangs EDGE_BLUR_OVERHANG past the arch's outer edge
          [side]: -EDGE_BLUR_OVERHANG,
          top: EDGE_BLUR_TOP,
          width: EDGE_BLUR_WIDTH,
          height: EDGE_BLUR_HEIGHT,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          maskImage: mask,
          WebkitMaskImage: mask,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
        // Faded per layer, not on a wrapper: an ancestor with opacity would
        // cut the backdrop blur off from the page behind it
        initial={false}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ duration: MOVE / 2 }}
      />
    );
  });
}

// --- Idle float ----------------------------------------------------------------
// On the email step, the tiles drift a little: a slow bob and a slight tilt,
// each on its own period and phase per tile (and the bob and tilt out of step
// with each other), so it never reads as mechanical. Other steps settle still.
const FLOAT_BOB = 4; // px
const FLOAT_TILT = 1.5; // deg

function TileFloat({
  index,
  mode,
  delay,
  children,
}: {
  index: number;
  mode: AuthArchMode;
  // When the tile has landed from the entrance (s)
  delay: number;
  children: React.ReactNode;
}) {
  const floating = mode === "arch";
  // Per-tile periods (s) and phase offsets, so no two tiles move together
  const bobPeriod = 3.4 + (index % 3) * 0.45;
  const tiltPeriod = bobPeriod * 1.37;
  const phase = (index * 0.61) % 1;

  const bob = FLOAT_BOB;
  const tilt = FLOAT_TILT;

  return (
    // No `initial={false}`: that would skip the animation on mount, and the
    // float would only start after a step change (i.e. off the email step)
    <motion.div
      className="size-full"
      animate={
        !floating
          ? { y: 0, rotate: 0 }
          : // `null` starts from wherever the tile is, so restarting on a step
            // change never jumps
            {
              y: [null, -bob, 0, bob * 0.6, 0],
              rotate: [null, tilt, 0, -tilt, 0],
            }
      }
      transition={
        !floating
          ? { duration: MOVE / 2, ease: EASE_OUT }
          : {
              y: {
                duration: bobPeriod,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay + phase * bobPeriod,
              },
              rotate: {
                duration: tiltPeriod,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay + phase * tiltPeriod,
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * One avatar tile on its own, at any size: the arc's full tile (gradient,
 * glow, live white glyph) scaled down. `index` picks the colour, left to right
 * along the arc (0 is indigo).
 */
export function AvatarTile({
  size,
  index = 0,
  expressionIndex = 0,
}: {
  size: number;
  index?: number;
  expressionIndex?: number;
}) {
  const style = TILES[index] ?? TILES[0];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute top-0 left-0"
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          transform: `scale(${size / TILE_SIZE})`,
          transformOrigin: "top left",
          borderRadius: TILE_RADIUS,
          backgroundImage: gradientCss(style),
          boxShadow: glowShadow(style.glow, 0.4),
        }}
      >
        <div
          className="absolute"
          style={{
            inset: (TILE_SIZE - GLYPH_SIZE) / 2,
            width: GLYPH_SIZE,
            height: GLYPH_SIZE,
          }}
        >
          <AvatarGlyph
            expressionIndex={expressionIndex}
            className="size-full text-white drop-shadow-[0_4px_4px_rgba(255,255,255,0.25)]"
          />
        </div>
      </div>
    </div>
  );
}

// A glyph layer, centred on the tile at GLYPH_SIZE
function Glyph({
  variants,
  children,
}: {
  variants: Variants;
  children: React.ReactNode;
}) {
  const inset = (TILE_SIZE - GLYPH_SIZE) / 2;
  return (
    <motion.div
      className="absolute"
      style={{ inset, width: GLYPH_SIZE, height: GLYPH_SIZE }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}
