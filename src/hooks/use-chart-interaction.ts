"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  curveYAt,
  formatChartTime,
  nearestPoint,
  type ChartData,
} from "@/lib/helpers/chart";

// Where the hover dot sits on the line (following the cursor), and the
// nearest candle's close, change from the chart's first close, and time.
export type CrosshairInfo = {
  normX: number;
  normY: number;
  price: number;
  change: number;
  timeLabel: string;
};

const DRAG_THRESHOLD = 40;

const DEFAULT_CROSSHAIR: CrosshairInfo = {
  normX: 1,
  normY: 0.5,
  price: 0,
  change: 0,
  timeLabel: "",
};

// The dot glides along the line with the cursor; the price is the nearest
// candle's real close.
function computeCrosshair(
  normX: number,
  data: ChartData,
): CrosshairInfo {
  const point = nearestPoint(data.points, normX);
  return {
    normX,
    normY: curveYAt(data.curve, normX),
    price: point.price,
    change: ((point.price - data.basePrice) / data.basePrice) * 100,
    timeLabel: formatChartTime(point.time, data.span),
  };
}

export function useChartInteraction(
  expanded: boolean,
  chartData: ChartData | null,
  onTiltVelocity: (v: number) => void,
  onDragThresholdMet?: () => void,
) {
  // Cursor position across the chart (0–1); starts on the latest candle.
  const [cursorX, setCursorX] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const prevXRef = useRef<number | null>(null);
  const prevTimeRef = useRef(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Derived, so it follows the cursor and the chart (e.g. a range change).
  const crosshair = useMemo(
    () => (chartData ? computeCrosshair(cursorX, chartData) : DEFAULT_CROSSHAIR),
    [cursorX, chartData],
  );

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
      if (!expanded || !chartData) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const normX = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      setCursorX(normX);
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
    [expanded, chartData, onTiltVelocity],
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
