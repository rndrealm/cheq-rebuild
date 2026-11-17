"use client";

import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { RenderIf } from "@/components/ui/render-if";
import { useSlotButtonMotion, useSwapMotion } from "@/components/auth/motion";

// Label and spinner swapping in place, as the token card's button does
const contentMotion = {
  initial: { opacity: 0, filter: "blur(6px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(4px)" },
  transition: { duration: 0.2 },
};

/**
 * The step's submit button, for the slot under the field once there's
 * something in it (it takes the Google button's or the hint's place). Submits
 * the form `form` (its id), so it does what Enter does. Give it the same `key`
 * on every step, so it stays put from step to step rather than re-entering.
 */
export function ContinueButton({
  form,
  label = "Continue",
  pending = false,
  disabledReason,
  reasonShown = false,
  className,
}: {
  form: string;
  label?: string;
  // While the step's request runs: a spinner in place of the label, and no
  // second submit
  pending?: boolean;
  // Why the field can't be submitted yet (e.g. "At least 8 characters"). Set,
  // the button stays visible but faded and won't submit, and the reason shows
  // in a tooltip under it on hover or focus.
  disabledReason?: string;
  // Shows the reason regardless of hover (briefly after Enter on a field that
  // isn't valid yet; see useReasonFlash)
  reasonShown?: boolean;
  // e.g. a different `top` for steps that place it elsewhere
  className?: string;
}) {
  const slotMotion = useSlotButtonMotion();
  const contentSwap = useSwapMotion(contentMotion);
  const blocked = !!disabledReason && !pending;
  const reasonId = `${form}-reason`;

  return (
    <motion.button
      // Not `disabled` while blocked: a disabled button gets no hover, and the
      // hover is what shows the reason. aria-disabled + blocking the click.
      type="submit"
      form={form}
      disabled={pending}
      aria-busy={pending}
      aria-disabled={blocked || undefined}
      aria-describedby={blocked ? reasonId : undefined}
      onClick={(e) => {
        if (blocked) e.preventDefault();
      }}
      // Solid black, as the token card's bet button: inset dark shadow and a
      // white top highlight, a little squash on press. The same size as the
      // field above (full width, 52px), so it runs 6px past the 46px slot;
      // nothing sits below it, so that moves nothing.
      // Hover/press lighten the background rather than lowering opacity:
      // Motion holds the button's opacity at 1 (its enter animation), which
      // would override an opacity class. Same for the faded blocked look.
      className={cn(
        "group absolute inset-x-0 top-0 flex h-13 w-full items-center justify-center gap-1.5 rounded-full text-sm font-medium outline-none transition-colors motion-reduce:transition-none disabled:pointer-events-none",
        "shadow-[inset_0px_2px_4px_0px_#0B0B0B,inset_0px_2.5px_0px_0px_#FFFFFFB2]",
        blocked
          ? "cursor-not-allowed bg-[#0B0B0B]/50 text-white/60"
          : "cursor-pointer bg-[#0B0B0B] text-white hover:bg-[#262626] active:bg-[#333333]",
        className,
      )}
      whileTap={blocked ? undefined : { scale: 0.97 }}
      {...slotMotion}
      // When a step moves the button (a different `top`), it slides there
      // rather than snapping. "position" keeps its size from being animated.
      layout="position"
      transition={{
        // The press springs, as the token card's does (enter/exit carry their
        // own timing in the slot button motion)
        scale: { type: "spring", stiffness: 500, damping: 30 },
        layout: { duration: 0.6, ease: EASE_OUT },
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.span
            key="spinner"
            role="status"
            className="flex items-center"
            {...contentSwap}
          >
            <span className="sr-only">{label}…</span>
            <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </motion.span>
        ) : (
          <motion.span key="label" {...contentSwap}>
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Why it can't be submitted yet: a small dark pill under the button,
          on hover/focus (or while `reasonShown`). Below rather than above, as
          the field sits right above the button. */}
      <RenderIf condition={!!disabledReason}>
        <span
          id={reasonId}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-full bg-[#0B0B0B] px-3 py-1.5 text-xs leading-4 font-medium whitespace-nowrap text-white opacity-0 transition-opacity duration-150 motion-reduce:transition-none",
            blocked && "group-hover:opacity-100 group-focus-visible:opacity-100",
            blocked && reasonShown && "opacity-100",
          )}
        >
          {disabledReason}
        </span>
      </RenderIf>
    </motion.button>
  );
}
