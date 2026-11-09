"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { MinusIcon, PlusIcon } from "@/lib/svgs";

const EXPANDED_HEIGHT = 145;
const COLLAPSED_HEIGHT = 70;

/** Home page promo for Cheq Rewards. Collapses down to its text. */
export function RewardsCard() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.section
      initial={false}
      animate={{ height: collapsed ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT }}
      transition={{ type: "spring", duration: 0.35, bounce: 0 }}
      className="relative shrink-0 overflow-clip rounded-xl bg-card font-display"
    >
      <button
        type="button"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand Cheq Rewards" : "Collapse Cheq Rewards"}
        onClick={() => setCollapsed((v) => !v)}
        className="absolute top-4 right-4 flex size-5 cursor-pointer items-center justify-center rounded text-black outline-none hover:bg-gray-3 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {collapsed ? (
          <PlusIcon className="size-5" />
        ) : (
          <MinusIcon className="size-3" />
        )}
      </button>

      <div className="absolute bottom-4 left-4 flex w-62 flex-col gap-0.5 text-sm leading-4.5 tracking-[-0.0046em]">
        <h2 className="font-medium text-gray-12">Cheq Rewards</h2>
        <p className="text-gray-12/66">
          Get rewards in $ when you trade on cheq
        </p>
      </div>
    </motion.section>
  );
}
