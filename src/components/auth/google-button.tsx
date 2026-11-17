"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useSlotButtonMotion } from "@/components/auth/motion";

/**
 * "Sign in with Google", for the slot under the email field. Give it a `key`.
 * Pair it with useGoogleSignIn.
 */
export function GoogleButton({
  onClick,
  pending = false,
}: {
  onClick?: () => void;
  pending?: boolean;
}) {
  // Ghost button: wait for Continue to leave rather than show through it
  const slotMotion = useSlotButtonMotion({ waitForExit: true });
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-busy={pending}
      className="absolute inset-x-0 top-0.75 mx-auto flex h-10 w-fit cursor-pointer items-center gap-2.5 rounded-full px-3 text-sm font-medium text-white outline-none transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-60"
      {...slotMotion}
    >
      <Image
        src="/media/auth/google-g.svg"
        alt=""
        width={18}
        height={18}
        unoptimized
      />
      {pending ? "Opening Google…" : "Sign in with Google"}
    </motion.button>
  );
}
