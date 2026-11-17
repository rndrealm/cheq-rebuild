"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT } from "@/lib/variants";
import { cn } from "@/lib/utils";
import { useSwapMotion } from "@/components/auth/motion";

/**
 * The 46px slot under the field (Figma puts the Google button and the
 * password hint 13px under it). Children are overlaid, so swapping them never
 * moves anything; give each a `key`.
 */
export function AuthSlot({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-11.5 w-full">
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  );
}

const slotTextMotion = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(8px)" },
  transition: { duration: 0.6, delay: 0.15, ease: EASE_OUT },
};

// A line of text in the slot (a hint, or an error with role="alert"),
// blurring in
export function SlotText({
  children,
  className,
  role,
}: {
  children: ReactNode;
  className?: string;
  role?: "alert";
}) {
  const swap = useSwapMotion(slotTextMotion);
  return (
    <motion.p
      role={role}
      className={cn(
        "absolute inset-0 flex items-center justify-center px-2.5 text-center text-sm leading-4 text-white",
        className,
      )}
      {...swap}
    >
      {children}
    </motion.p>
  );
}
