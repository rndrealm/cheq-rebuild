import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [usernameClient(), convexClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
