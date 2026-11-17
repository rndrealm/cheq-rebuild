"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useSwapMotion } from "@/components/auth/motion";

// The glass pill the auth fields sit in, and the pieces that go inside it.

// Browsers paint autofilled fields with their own (blue/yellow) background and
// won't let CSS override it. Delaying the background change indefinitely keeps
// the pill showing through; the text fill keeps autofilled text white.
const noAutofillTint = cn(
  "transition-[background-color] delay-[9999s] duration-[0s]",
  "autofill:[-webkit-text-fill-color:white] autofill:[caret-color:white]",
);

// A text input filling the pill
const pillInputClassName = cn(
  "absolute inset-0 size-full bg-transparent px-7 text-sm leading-4 font-medium text-white outline-none placeholder:text-white disabled:opacity-60",
  noAutofillTint,
);

/**
 * Props for an input inside the pill: its look, plus its state while the
 * step's request runs (`busy`: read-only rather than disabled, so focus stays
 * put for a retry) and when the step has an error (`errorId`: the id of the
 * error text that describes it).
 */
export function pillInputProps({
  busy = false,
  errorId,
}: {
  busy?: boolean;
  errorId?: string;
}) {
  return {
    readOnly: busy,
    "aria-invalid": !!errorId || undefined,
    "aria-describedby": errorId,
    className: cn(pillInputClassName, busy && "opacity-60"),
  };
}

/**
 * The glass pill the fields sit in. Put each step's field in a keyed
 * `PillField` inside it, so they swap in place. With `glass={false}` it drops
 * its glass and clipping (the welcome step has no field).
 */
export function AuthPill({
  glass = true,
  error = false,
  children,
}: {
  glass?: boolean;
  // Swaps to the error glass: tinted with the error colour #E04746, with a
  // bright top edge
  error?: boolean;
  children: ReactNode;
}) {
  // The glass changes on one timing. Going into an error it waits for the
  // background's red to arrive (its red circle starts turning ~0.25s in);
  // clearing, the background starts at once, so does it. (None with reduced
  // motion: the glass just switches.)
  const errorTiming = cn(
    "transition-opacity duration-600 ease-out motion-reduce:transition-none",
    error ? "delay-300" : "delay-0",
  );

  return (
    // No focus ring for now (auth screens have outlines switched off)
    <div
      className={cn("relative h-13 w-full rounded-[40px]", glass && "overflow-hidden")}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[40px]",
          errorTiming,
          "bg-[linear-gradient(179.5deg,rgba(245,245,245,0.3)_25.16%,rgba(227,227,227,0.3)_343.35%)] shadow-[inset_-1px_0px_0px_0px_rgba(0,0,0,0.05),inset_0px_0.5px_2px_0px_rgba(11,11,11,0.12),inset_0px_2px_0px_0px_rgba(255,255,255,0.2)]",
          (!glass || error) && "opacity-0",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[40px]",
          errorTiming,
          // The gradient runs down into the error red and the inner shadows
          // are it (no offset, so they wrap every side evenly), so the field
          // sits in the red rather than on it
          "bg-[linear-gradient(179.5deg,rgba(255,255,255,0.3)_25.16%,rgba(224,71,70,0.3)_343.35%)] shadow-[inset_0px_0px_0px_1px_rgba(224,71,70,0.35),inset_0px_0px_8px_0px_rgba(224,71,70,0.5),inset_0px_1px_0px_0px_rgba(255,255,255,0.39)]",
          !(glass && error) && "opacity-0",
        )}
      />
      <AnimatePresence initial={false} mode="wait">
        {children}
      </AnimatePresence>
    </div>
  );
}

// Fields swapping inside the pill: a simple fade + blur, the old one out and
// then the new one in (AnimatePresence mode="wait" in AuthPill)
const pillFieldMotion = {
  initial: { opacity: 0, filter: "blur(4px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(4px)" },
  transition: { duration: 0.15 },
};

// One step's field inside the pill. Give it a `key` per step.
export function PillField({ children }: { children: ReactNode }) {
  const swap = useSwapMotion(pillFieldMotion);
  return (
    <motion.div className="absolute inset-0" {...swap}>
      {children}
    </motion.div>
  );
}

// Enter only submits a form with several text fields (e.g. a hidden username
// + password) if it has a submit button. Put one of these in every auth form.
export function EnterSubmits() {
  return <button type="submit" tabIndex={-1} aria-hidden className="sr-only" />;
}

// Lets password managers pair a password with the email from an earlier step
export function HiddenUsername({ email }: { email: string }) {
  return (
    <input
      type="email"
      autoComplete="username"
      value={email}
      readOnly
      tabIndex={-1}
      aria-hidden
      className="sr-only"
    />
  );
}
