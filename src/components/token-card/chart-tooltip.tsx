"use client";

import { forwardRef } from "react";
import { formatPrice } from "@/lib/helpers/format";
import type { CrosshairInfo } from "@/hooks/use-chart-interaction";

type ChartTooltipProps = {
  crosshair: CrosshairInfo;
  left: number;
  top: number;
};

export const ChartTooltip = forwardRef<HTMLDivElement, ChartTooltipProps>(
  function ChartTooltip({ crosshair, left, top }, ref) {
    return (
      <div
        ref={ref}
        className="pointer-events-none absolute z-20"
        style={{
          left,
          top,
          transform: "translate(-50%, calc(-100% - 22px))",
          transformOrigin: "bottom center",
        }}
      >
        <div className="rounded-xl border border-white bg-[#F3F3F3] px-3 py-2 text-center whitespace-nowrap">
          <div className="text-base font-semibold leading-5.5 text-[#0b0b0b]">
            {formatPrice(crosshair.price)}
          </div>
          <div className="text-xs font-medium leading-4 text-[#7b7b7b]">
            {crosshair.change >= 0
              ? `+${crosshair.change.toFixed(2)}%`
              : `-${Math.abs(crosshair.change).toFixed(2)}%`}
          </div>
        </div>
        <div className="mx-auto -mt-px h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-[#F3F3F3]" />
      </div>
    );
  },
);
