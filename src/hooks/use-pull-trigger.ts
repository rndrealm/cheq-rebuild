"use client";

import { animate, type PanInfo, useMotionValue } from "motion/react";
import { type MouseEvent, useRef, useState } from "react";

type PullTriggerOptions = {
  onTrigger: () => void;
  // Furthest the handle moves (px), however far it's dragged
  max: number;
  // Drag distance (px) that, released past, fires onTrigger
  threshold: number;
};

/**
 * A handle pulled rightwards to fire an action. `pull` is the handle's rubber-banded
 * offset (0..max) and springs back on release. Clicking, or Enter/Space when focused,
 * fires it too. Spread `handlers` onto a motion element.
 */
export function usePullTrigger({ onTrigger, max, threshold }: PullTriggerOptions) {
  const pull = useMotionValue(0);
  const panned = useRef(false);
  // True mid-drag, e.g. to keep the handle shown if the pointer slips off it
  const [dragging, setDragging] = useState(false);

  const handlers = {
    onPointerDown: () => {
      panned.current = false;
    },
    onPanStart: () => {
      panned.current = true;
      setDragging(true);
      pull.stop();
    },
    // Rubber-band towards max
    onPan: (_: PointerEvent, info: PanInfo) => {
      const dx = Math.max(0, info.offset.x);
      pull.set(max * (1 - Math.exp(-dx / (max * 1.5))));
    },
    // Returns and straightens without overshoot
    onPanEnd: (_: PointerEvent, info: PanInfo) => {
      if (info.offset.x >= threshold) onTrigger();
      setDragging(false);
      animate(pull, 0, { type: "spring", bounce: 0, duration: 0.35 });
    },
    onClick: (e: MouseEvent) => {
      // A pan already handled this pointer interaction. Keyboard clicks (detail 0)
      // always fire, even if the last pointer interaction was a pan.
      if (panned.current && e.detail !== 0) return;
      onTrigger();
    },
  };

  return { pull, dragging, handlers };
}
