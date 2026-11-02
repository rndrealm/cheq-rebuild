import type { Variants } from "motion/react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.64, 0, 0.78, 0] as const;
// Gentler than EASE_OUT so the spread keeps moving right up to the swap
export const EASE_SPREAD = [0.4, 0, 0.2, 1] as const;

// Ticket (home TicketPull)

export const STUB_WIDTH = 42;

// When the spread stack swaps for the body (and back). Every later step overlaps
// the one before it, so the ticket unfolds as one motion rather than stop-start.
export const SWAP_OPEN = 0.18;
export const SWAP_CLOSE = 0.2;
// The stub starts stretching the moment the body lands
export const STUB_OPEN = SWAP_OPEN;

// Tokens spread until their footprint matches the body, so the swap is size-for-size.
// `custom` is the token's spread distance in px.
export const tokenVariants: Variants = {
  closed: {
    x: 0,
    transition: { duration: 0.22, delay: SWAP_CLOSE, ease: EASE_OUT },
  },
  open: (x: number) => ({
    x,
    transition: { duration: SWAP_OPEN, ease: EASE_SPREAD },
  }),
};

export const stackVariants: Variants = {
  closed: { opacity: 1, transition: { duration: 0, delay: SWAP_CLOSE } },
  open: { opacity: 0, transition: { duration: 0, delay: SWAP_OPEN } },
};

export const bodyVariants: Variants = {
  closed: { opacity: 0, transition: { duration: 0, delay: SWAP_CLOSE } },
  open: { opacity: 1, transition: { duration: 0, delay: SWAP_OPEN } },
};

export const avatarVariants: Variants = {
  closed: {
    opacity: 0,
    scale: 0.6,
    transition: { duration: 0.18, ease: EASE_IN },
  },
  open: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.35,
      duration: 0.45,
      delay: STUB_OPEN + 0.08,
    },
  },
};

// The stub stretches out of the body's right edge from zero width
export const stubVariants: Variants = {
  closed: {
    width: 0,
    transition: { duration: 0.22, delay: 0.02, ease: EASE_IN },
  },
  open: {
    width: STUB_WIDTH,
    transition: {
      type: "spring",
      bounce: 0.25,
      duration: 0.45,
      delay: STUB_OPEN,
    },
  },
};

// The bar stays a bar and rides along beside the ticket's edge
export const barVariants: Variants = {
  closed: {
    left: 148,
    transition: { duration: 0.22, delay: 0.02, ease: EASE_IN },
  },
  open: {
    left: 192,
    transition: {
      type: "spring",
      bounce: 0.25,
      duration: 0.45,
      delay: STUB_OPEN,
    },
  },
};

export const textVariants: Variants = {
  closed: { opacity: 0, y: 2, transition: { duration: 0.12 } },
  open: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: STUB_OPEN + 0.18, ease: EASE_OUT },
  },
};
