"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { interpolateY } from "@/lib/helpers/chart";
import type { ChartData } from "./use-token-chart";

export type CrosshairInfo = {
  normX: number;
  normY: number;
  price: number;
  change: number;
};

const DRAG_THRESHOLD = 40;

const DEFAULT_CROSSHAIR: CrosshairInfo = {
  normX: 1,
  normY: 0.5,
  price: 0,
  change: 0,
};

function computeCrosshair(
  normX: number,
  data: ChartData,
): CrosshairInfo {
  const normY = interpolateY(data.points, normX);
  const price =
    data.maxPrice -
    ((normY - 0.1) / 0.8) * (data.maxPrice - data.minPrice);
  const change = ((price - data.basePrice) / data.basePrice) * 100;
  return { normX, normY, price, change };
}

export function useChartInteraction(
  expanded: boolean,
  chartData: ChartData | null,
  onTiltVelocity: (v: number) => void,
  onDragThresholdMet?: () => void,
) {
  const [crosshair, setCrosshair] = useState<CrosshairInfo>(DEFAULT_CROSSHAIR);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const chartDataRef = useRef(chartData);
  chartDataRef.current = chartData;

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const prevXRef = useRef<number | null>(null);
  const prevTimeRef = useRef(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (chartData) {
      setCrosshair((prev) => computeCrosshair(prev.normX, chartData));
    }
  }, [chartData]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!expanded) return;
      hasDraggedRef.current = true;
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const handleUp = (upEvent: PointerEvent) => {
        isDraggingRef.current = false;
        setIsDragging(false);

        if (dragStartRef.current && onDragThresholdMet) {
          const dx = upEvent.clientX - dragStartRef.current.x;
          const dy = upEvent.clientY - dragStartRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance >= DRAG_THRESHOLD) {
            onDragThresholdMet();
          }
        }
        dragStartRef.current = null;
      };
      document.addEventListener("pointerup", handleUp, { once: true });
      document.addEventListener("pointercancel", handleUp, { once: true });
    },
    [expanded, onDragThresholdMet],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!expanded || !chartDataRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const normX = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      setCrosshair(computeCrosshair(normX, chartDataRef.current));
      setIsHovering(true);

      const now = performance.now();
      const clientX = e.clientX;
      if (prevXRef.current !== null) {
        const dt = now - prevTimeRef.current;
        if (dt > 0) {
          const mouseVelocity = (clientX - prevXRef.current) / dt;
          onTiltVelocity(mouseVelocity * 60);
          if (isDraggingRef.current) {
            hasDraggedRef.current = true;
          }
        }
      }
      prevXRef.current = clientX;
      prevTimeRef.current = now;
    },
    [expanded, onTiltVelocity],
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    prevXRef.current = null;
  }, []);

  const consumeDrag = useCallback(() => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    crosshair,
    isHovering,
    isDragging,
    handlePointerDown,
    handleMouseMove,
    handleMouseLeave,
    consumeDrag,
  };
}
