"use client";

import { useCallback, useState } from "react";

/**
 * An error message that belongs to the step it happened on, so it doesn't
 * follow the user to another step (e.g. via the browser's Back). Returns the
 * current step's error ("" if none) and a setter, which defaults to the
 * current step; pass `on` when a request's result is for another step.
 */
export function useStepError<S extends string>(step: S) {
  const [failure, setFailure] = useState<{ step: S; message: string } | null>(
    null,
  );
  const error = failure && failure.step === step ? failure.message : "";

  const setError = useCallback(
    (message: string, on: S = step) =>
      setFailure(message ? { step: on, message } : null),
    [step],
  );

  return { error, setError };
}
