"use client";
import React, { useState } from "react";
import { TokenCard } from "../token-card";
import type { BetDirection } from "../token-card/bet-dialog";
import { MOCK_BET } from "@/app/demo/page";
import { cn } from "@/lib/utils";
import { CircleArrowIcon } from "@/lib/svgs";

export function Hero() {
  const [direction, setDirection] = useState<BetDirection>("up");

  return (
    <section
      className={cn(
        "max-w-6xl w-full mx-auto py-28 flex justify-center rounded-[50px] relative overflow-hidden transition-none duration-500",
        direction === "up" ? "bg-[#6DCB72]" : "bg-[#FF3C83]",
      )}
    >
      <div className="absolute top-6 left-6 flex flex-col gap-6">
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            className="flex gap-6"
            style={{ marginLeft: row % 2 === 1 ? -80 : 0 }}
          >
            {new Array(8).fill(0).map((_, i) => (
              <CircleArrowIcon
                key={i}
                iconFill={direction === "down" ? "#FF2A6A" : undefined}
                arrowFill={direction === "down" ? "#E51435" : undefined}
                rotation={direction === "down" ? 180 : 0}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="relative z-3">
        <TokenCard
          bet={MOCK_BET}
          variant="hero"
          onDirectionChange={setDirection}
        />
      </div>

      <div className="absolute inset-0 pointer-none:">
        {/* <Webgl direction={direction} /> */}
      </div>
    </section>
  );
}
