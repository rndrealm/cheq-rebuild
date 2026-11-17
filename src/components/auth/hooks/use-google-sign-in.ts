"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { AppRoutes } from "@/lib/routes";

/**
 * Starts Better Auth's Google sign-in (which redirects away to Google). Fails
 * with an error until the backend has the Google provider configured.
 */
export function useGoogleSignIn(onError: (message: string) => void) {
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    try {
      const { error } = await signIn.social({
        provider: "google",
        callbackURL: AppRoutes.home.path,
      });
      if (error) {
        onError(error.message ?? "Couldn't sign in with Google");
        setPending(false);
      }
      // On success the page is on its way to Google, so stay pending
    } catch {
      onError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return { start, pending };
}
