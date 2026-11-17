"use client";

import type { ReactNode } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import { ChevronLeftIcon } from "@/lib/svgs";
import { EASE_OUT } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { RenderIf } from "@/components/ui/render-if";
import { instant, useSwapMotion } from "@/components/auth/motion";
import {
  AuthBackground,
  type AuthBackgroundVariant,
  type AuthTone,
} from "@/components/auth/visuals/auth-background";
import {
  AuthArch,
  type AuthArchMode,
} from "@/components/auth/visuals/auth-arch";
import { INTRO, introFadeDown } from "@/components/auth/visuals/intro";

// The auth screens' layout: blurred backdrop, avatar-tile arch, heading, the
// field area (the page's form and the slot under it), a footer, and a back
// button. Pages own their steps; this owns the layout and the motion between
// them.

// Which background transitions to use: "front" (spreads from the logo) or
// "circles" (each circle changes and moves on its own)
const BACKGROUND_VARIANT: AuthBackgroundVariant = "circles";

// Welcome step: the heading sits at 284 in Figma, 29px above the usual 313
const HEADING_WELCOME_LIFT = 29;

const headingMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: EASE_OUT },
};

// Footer content swapping between steps: a fade + blur
const footerSwapMotion = {
  initial: { opacity: 0, filter: "blur(4px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(4px)" },
  transition: { duration: 0.25, ease: EASE_OUT },
};

// The footer's part of the page-load entrance
const footerEntrance = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  transition: { duration: 0.8, delay: INTRO.terms, ease: EASE_OUT },
};

// The back button showing and hiding as steps gain or lose somewhere to go back
const backButtonMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: EASE_OUT },
};

/**
 * The full auth screen. `children` is the field area (the form and the slot
 * under it); it, the heading and the footer play the page's entrance.
 */
export function AuthScene({
  tone,
  arch,
  heading,
  footer,
  footerKey = "footer",
  error = false,
  welcome = false,
  onBack,
  children,
}: {
  tone: AuthTone;
  arch: AuthArchMode;
  heading: string;
  footer?: ReactNode;
  // Change it whenever `footer` becomes different content (e.g. per step), so
  // the swap fades + blurs rather than snapping
  footerKey?: string;
  // The step has an error: the background turns into the red error context
  error?: boolean;
  // Sign-up's welcome step: the background merges into white, so the heading
  // turns dark and sits HEADING_WELCOME_LIFT higher (Figma)
  welcome?: boolean;
  // Goes back a step. Pass it on steps that have one to go back to, and the
  // back button shows (top left, Figma); leave it out and the button hides.
  onBack?: () => void;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const headingSwap = useSwapMotion(headingMotion);
  const footerSwap = useSwapMotion(footerSwapMotion);
  const backSwap = useSwapMotion(backButtonMotion);
  // The page-load entrance (instant with reduced motion: everything just there)
  const entrance = (delay: number) =>
    reduced ? instant(introFadeDown(delay)) : introFadeDown(delay);

  return (
    <MotionConfig reducedMotion="user">
      <main
        className={cn(
          "relative flex min-h-screen flex-col items-center overflow-hidden bg-white px-4 pt-41 font-display tracking-normal",
          // With a footer, the page's bottom padding is the footer's 54px gap
          // from the bottom edge (it sits in the flow, pushed down; see below)
          footer ? "pb-[54px]" : "pb-24",
        )}
      >
        <AuthBackground
          tone={tone}
          variant={BACKGROUND_VARIANT}
          error={error}
          white={welcome}
        />

        {/* Figma: a 24px round button 32px in from the top left, 20% white,
            with a 16px chevron. A direct child of AnimatePresence (not in
            RenderIf), so it can fade out as it leaves. */}
        <AnimatePresence initial={false}>
          {onBack && (
            <motion.button
              key="back"
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="absolute top-8 left-8 z-10 flex size-6 cursor-pointer items-center justify-center rounded-[20px] bg-white/20 text-black outline-none transition-colors hover:bg-white/30"
              {...backSwap}
            >
              <ChevronLeftIcon className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <AuthArch mode={arch} />

        <div className="relative flex w-[281px] max-w-full flex-col items-center gap-8">
          {/* Fixed height, so swapping the heading doesn't move the field */}
          <motion.h1
            className={cn(
              "relative h-8 w-full text-center text-[32px] leading-8 font-semibold transition-colors duration-700 motion-reduce:transition-none",
              welcome ? "text-[#0b0b0b]" : "text-white",
            )}
            {...entrance(INTRO.heading)}
          >
            {/* Separate layer for the welcome lift, so it doesn't fight the
                entrance's own movement on the heading */}
            <motion.span
              className="absolute inset-0"
              initial={false}
              animate={{ y: welcome ? -HEADING_WELCOME_LIFT : 0 }}
              transition={{ duration: reduced ? 0 : 0.6, ease: EASE_OUT }}
            >
              <AnimatePresence initial={false}>
                <motion.span
                  key={heading}
                  className="absolute inset-0"
                  {...headingSwap}
                >
                  {heading}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          </motion.h1>

          <motion.div
            className="flex w-full flex-col items-center gap-[13px]"
            {...entrance(INTRO.field)}
          >
            {children}
          </motion.div>
        </div>

        <RenderIf condition={!!footer}>
          {/* In the page's flow, pushed to the bottom (mt-auto): on a normal
              screen it sits exactly where a 54px-from-the-bottom footer would.
              On a short screen it drops below the content (the page scrolls)
              instead of sitting on top of it. pt-20 keeps it clear of what
              hangs below the field area: the welcome step's lower Continue
              (~60px) and the reason tooltip. */}
          <motion.div
            className="relative mt-auto w-full max-w-[680px] pt-20 text-center text-sm leading-4 text-white"
            {...(reduced ? instant(footerEntrance) : footerEntrance)}
          >
            {/* A new `footerKey` swaps the footer: the old one out, then the
                new one in */}
            <AnimatePresence initial={false} mode="wait">
              <motion.div key={footerKey} {...footerSwap}>
                {footer}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </RenderIf>
      </main>
    </MotionConfig>
  );
}
