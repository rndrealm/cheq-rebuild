"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shows a disabled button's reason for a moment, for when the user presses
 * Enter on a field that isn't valid yet (there's no hover then). Returns
 * whether it's showing and a function to show it.
 */
export function useReasonFlash(ms = 2000) {
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Don't leave a timer running after unmount
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flash = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setShown(true);
    timer.current = setTimeout(() => setShown(false), ms);
  }, [ms]);

  return [shown, flash] as const;
}
