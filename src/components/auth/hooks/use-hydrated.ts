"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * False on the server and during hydration, true once the page is running in
 * the browser. For logic that must wait for browser-only state (e.g. session
 * storage) before acting on it.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
