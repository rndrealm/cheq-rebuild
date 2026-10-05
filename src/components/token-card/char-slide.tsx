"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const charSpring = { type: "spring" as const, duration: 0.25, bounce: 0 };

export function CharSlide({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex", className)}>
      {text.split("").map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          layout="position"
          transition={charSpring}
          className="inline-block"
          style={char === " " ? { width: "0.25em" } : undefined}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
