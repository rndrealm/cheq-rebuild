"use client";

import { useCallback, useRef, useState } from "react";
import {
  INTERVAL_DATA,
  BASE_PRICE,
  PRICE_RANGE,
  interpolateY,
} from "@/lib/helpers/chart";

export type CrosshairInfo = {
  normX: number;
  normY: number;
  price: number;
  change: number;
};

const DRAG_THRESHOLD = 40;

function computeCrosshair(normX: number, interval: string): CrosshairInfo {
  const points = INTERVAL_DATA[interval];
  const normY = interpolateY(points, normX);
  const price = BASE_PRICE + (0.5 - normY) * PRICE_RANGE;
  const change = ((price - BASE_PRICE) / BASE_PRICE) * 100;
  return { normX, normY, price, change };
}

export function useChartInteraction(
  expanded: boolean,
  activeInterval: string,
  onTiltVelocity: (v: number) => void,
  onDragThresholdMet?: () => void,
) {
  const [crosshair, setCrosshair] = useState<CrosshairInfo>(() =>
    computeCrosshair(1, "1D"),
  );
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const prevXRef = useRef<number | null>(null);
  const prevTimeRef = useRef(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

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
      if (!expanded) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const normX = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      setCrosshair(computeCrosshair(normX, activeInterval));
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
    [expanded, activeInterval, onTiltVelocity],
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    prevXRef.current = null;
  }, []);

  const handleIntervalChange = useCallback((interval: string) => {
    setCrosshair((prev) => computeCrosshair(prev.normX, interval));
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
    handleIntervalChange,
    consumeDrag,
  };
}
