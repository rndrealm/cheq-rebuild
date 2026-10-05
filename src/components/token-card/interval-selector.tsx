"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { INTERVALS } from "@/lib/helpers/chart";

type IntervalSelectorProps = {
  activeInterval: string;
  onIntervalChange: (interval: string) => void;
};

export function IntervalSelector({
  activeInterval,
  onIntervalChange,
}: IntervalSelectorProps) {
  return (
    <div className="mt-auto flex items-center justify-center gap-0.5 px-5.5 pb-7 pt-4">
      {INTERVALS.map((interval) => (
        <button
          key={interval}
          onClick={() => onIntervalChange(interval)}
          className={cn(
            "relative cursor-pointer rounded-lg px-2 py-1.5 text-sm font-semibold leading-5 transition-colors",
            activeInterval === interval
              ? "text-fg-base"
              : "text-fg-300 hover:text-fg-400",
          )}
        >
          {activeInterval === interval && (
            <motion.span
              layoutId="interval-bg"
              className="absolute inset-0 rounded-lg bg-bg-200"
              transition={{
                type: "spring",
                duration: 0.4,
                bounce: 0.15,
              }}
            />
          )}
          <span className="relative">{interval}</span>
        </button>
      ))}
    </div>
  );
}
