import { EASE_OUT } from "@/lib/variants";

// The auth screens' entrance, played once on load. Start times (s) for each
// group, in order; each overlaps the one before so it reads as one motion.
export const INTRO = {
  // First tile (the centre one) starts falling
  tiles: 0.1,
  // Gap between tiles, working outward from the centre
  tileStagger: 0.07,
  // Email field and Google button
  field: 0.55,
  heading: 0.75,
  // The terms line under everything
  terms: 0.95,
} as const;

// Shared "fade down" for the field and headline
export const introFadeDown = (delay: number) => ({
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE_OUT },
});
