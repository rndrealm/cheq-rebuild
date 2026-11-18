"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useHydrated } from "@/components/auth/hooks/use-hydrated";

/**
 * A multi-step form's current step, kept in the URL (?step=password; the
 * first step has no param), so the browser's Back, Forward and refresh move
 * between steps. Uses the native history API, which Next's router stays in
 * sync with.
 *
 * The steps can branch: `previous` maps each step to the one before it (the
 * first step has none). Left out, the steps are a straight line in `steps`
 * order.
 *
 * `requires(step)` names an earlier step to send the user back to when the
 * current one can't work yet (e.g. the password step without an email, from
 * an old link or a fresh tab), or nothing if it can. Checked once the page is
 * running in the browser (stored fields aren't known before that).
 *
 * Returns:
 * - `step`: the step in the URL (the first for a missing or unknown one)
 * - `go(step)`: moves to a step, adding a history entry (`"replace"` swaps the
 *   current one instead)
 * - `back()`: one step back. Uses the browser's Back when the previous history
 *   entry is the previous step, so the history stays in step with the screen
 * - `backTo(step)`: the same, several steps at once (to a step on the way here)
 * - `isOn(step)`: whether the URL is still on a step (for a request that
 *   finishes after the user has moved on)
 */
export function useAuthStep<S extends string>(
  steps: readonly S[],
  {
    previous,
    requires,
  }: {
    previous?: Partial<Record<S, S>>;
    requires?: (step: S) => S | undefined;
  } = {},
) {
  const params = useSearchParams();
  const raw = params.get("step");
  const step = steps.find((s) => s === raw) ?? steps[0];
  const hydrated = useHydrated();

  const before = useCallback(
    (s: S): S | undefined => {
      if (previous) return previous[s];
      const index = steps.indexOf(s);
      return index > 0 ? steps[index - 1] : undefined;
    },
    [previous, steps],
  );

  // The steps from the first to `s`, e.g. email → username → new-password
  const pathTo = useCallback(
    (s: S) => {
      const path = [s];
      for (let p = before(s); p; p = before(p)) path.unshift(p);
      return path;
    },
    [before],
  );

  const go = useCallback(
    (next: S, mode: "push" | "replace" = "push") => {
      const query = new URLSearchParams(window.location.search);
      if (next === steps[0]) query.delete("step");
      else query.set("step", next);
      const qs = query.toString();
      const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
      // Next merges this with its own history state; `authStep` marks which
      // step the entry is, for backTo()
      const state = { authStep: next };
      if (mode === "push") window.history.pushState(state, "", url);
      else window.history.replaceState(state, "", url);
    },
    [steps],
  );

  const backTo = useCallback(
    (target: S) => {
      const path = pathTo(step);
      const from = path.length - 1;
      const to = path.indexOf(target);
      if (to < 0 || to >= from) return;
      // This entry was pushed as this step, so the entries before it are the
      // steps on the way here: go back through history rather than adding to
      // it
      if (window.history.state?.authStep === step) {
        window.history.go(to - from);
      } else {
        go(target, "replace");
      }
    },
    [step, pathTo, go],
  );

  const back = useCallback(() => {
    const p = before(step);
    if (p) backTo(p);
  }, [step, before, backTo]);

  const isOn = useCallback(
    (s: S) =>
      (new URLSearchParams(window.location.search).get("step") ?? steps[0]) ===
      s,
    [steps],
  );

  // Send the user back when this step can't work yet. The URL is the external
  // state being corrected, so this belongs in an effect.
  const redirect = hydrated ? requires?.(step) : undefined;
  useEffect(() => {
    if (redirect && redirect !== step) go(redirect, "replace");
  }, [redirect, step, go]);

  return { step, go, back, backTo, isOn };
}
