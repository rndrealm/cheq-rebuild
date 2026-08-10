"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

type MutationState<T> = {
  status: "idle" | "pending" | "success" | "error";
  data: T | null;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
};

export function useConvexMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation,
) {
  const rawMutate = useMutation(mutation);
  const [state, setState] = useState<MutationState<FunctionReturnType<Mutation>>>({
    status: "idle",
    data: null,
    error: null,
    isPending: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
  });

  const mutate = useCallback(
    async (args: FunctionArgs<Mutation>) => {
      setState({
        status: "pending",
        data: null,
        error: null,
        isPending: true,
        isSuccess: false,
        isError: false,
        isIdle: false,
      });
      try {
        const data = await rawMutate(args);
        setState({
          status: "success",
          data,
          error: null,
          isPending: false,
          isSuccess: true,
          isError: false,
          isIdle: false,
        });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({
          status: "error",
          data: null,
          error,
          isPending: false,
          isSuccess: false,
          isError: true,
          isIdle: false,
        });
        throw error;
      }
    },
    [rawMutate],
  );

  const reset = useCallback(() => {
    setState({
      status: "idle",
      data: null,
      error: null,
      isPending: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
    });
  }, []);

  return { mutate, reset, ...state };
}
