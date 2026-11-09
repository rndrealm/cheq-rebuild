"use client";

import { useCallback, useSyncExternalStore } from "react";

// Same-tab updates; the `storage` event only fires in other tabs.
const CHANGE = "stored-flag-change";
// Used when localStorage throws, so the flag still works for this page load.
const memory = new Map<string, boolean>();

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return memory.get(key) ?? false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

/**
 * A per-browser on/off preference kept in localStorage, shared by every
 * component (and tab) using the same key. False on the server and until set.
 * If storage is blocked it still works, but only until the page reloads.
 */
export function useStoredFlag(key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false,
  );

  const setValue = useCallback(
    (next: boolean) => {
      try {
        if (next) localStorage.setItem(key, "1");
        else localStorage.removeItem(key);
      } catch {
        memory.set(key, next);
      }
      window.dispatchEvent(new Event(CHANGE));
    },
    [key],
  );

  return [value, setValue] as const;
}
