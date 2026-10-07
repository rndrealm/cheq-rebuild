"use client";
import React, { useState } from "react";
import { TokenCard } from "../token-card";
import type { BetDirection } from "../token-card/bet-dialog";
import { MOCK_BET } from "@/app/demo/page";
import { Webgl } from "./webgl";

export function Hero() {
  const [direction, setDirection] = useState<BetDirection>(null);

  return (
    <div className="max-w-6xl w-full mx-auto py-28 flex justify-center rounded-[50px] relative overflow-hidden bg-[#119fee]">
      <div className="relative z-3">
        <TokenCard bet={MOCK_BET} onDirectionChange={setDirection} />
      </div>

      <div className="absolute inset-0 pointer-none:">
        <Webgl direction={direction} />
      </div>
    </div>
  );
}
