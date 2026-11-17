"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Text fields kept in session storage, so a refresh or a Back/Forward to a
// later step still has them. Per tab, gone when it closes, and kept out of
// the URL (history, logs). Never used for passwords.
//
// A tiny store per key: an in-memory copy is the source of truth (so typing
// still works if storage is unavailable), mirrored to session storage, and
// read through useSyncExternalStore so the browser gets the stored values on
// its first render, with no extra effect pass.

// Session storage keys for each form. Sign-up writes the sign-in one for
// "Sign in instead" (see handOffEmailToSignIn), so the email carries across.
export const SIGN_IN_FIELDS_KEY = "cheq:sign-in";
export const SIGN_UP_FIELDS_KEY = "cheq:sign-up";

// key -> the stored JSON string (a string, so snapshots compare by value)
const memory = new Map<string, string>();
const listeners = new Map<string, Set<() => void>>();

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    const stored = sessionStorage.getItem(key);
    if (stored !== null) memory.set(key, stored);
    return stored;
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // No storage: the in-memory copy still works for this page
  }
  listeners.get(key)?.forEach((notify) => notify());
}

function subscribe(key: string, notify: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(notify);
  return () => {
    set.delete(notify);
  };
}

// Only the declared fields, and only string values, from stored JSON
function parse<F extends string>(raw: string | null, initial: Record<F, string>) {
  const values = { ...initial };
  try {
    const stored: unknown = JSON.parse(raw ?? "null");
    if (stored && typeof stored === "object") {
      for (const field of Object.keys(initial) as F[]) {
        const value = (stored as Record<string, unknown>)[field];
        if (typeof value === "string") values[field] = value;
      }
    }
  } catch {
    // Unreadable: start from `initial`
  }
  return values;
}

/**
 * The fields stored under `key` (falling back to `initial`), and a setter for
 * one field. On the server and during hydration the values are `initial`;
 * use useHydrated before acting on them being empty.
 */
export function useStoredFields<F extends string>(
  key: string,
  initial: Record<F, string>,
) {
  const raw = useSyncExternalStore(
    useCallback((notify) => subscribe(key, notify), [key]),
    () => read(key),
    () => null,
  );
  // `initial` is a fresh object each render; its contents are what matter
  const initialJson = JSON.stringify(initial);
  const values = useMemo(
    () => parse(raw, JSON.parse(initialJson) as Record<F, string>),
    [raw, initialJson],
  );

  const setField = useCallback(
    (field: F, value: string) =>
      write(key, JSON.stringify({ ...parse(read(key), values), [field]: value })),
    [key, values],
  );

  return { values, setField };
}

// Puts an email where sign-in reads its own: sign-up's "Sign in instead", and
// a new account (so sign-in offers the latest account after sign-out)
export function handOffEmailToSignIn(email: string) {
  write(SIGN_IN_FIELDS_KEY, JSON.stringify({ email }));
}

/**
 * Forgets the fields stored under `key` (once signed in or up, so the next
 * visit to that form starts empty). Deliberately doesn't notify: the current
 * page keeps showing its values while it navigates away, rather than flashing
 * empty fields (and redirecting back a step) on the way out.
 */
export function clearStoredFields(key: string) {
  memory.delete(key);
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Nothing stored
  }
}
