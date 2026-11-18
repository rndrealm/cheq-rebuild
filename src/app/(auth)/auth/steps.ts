import type { AuthTone } from "@/components/auth/visuals/auth-background";
import type { AuthArchMode } from "@/components/auth/visuals/auth-arch";

// One flow for signing in and signing up. The email step checks whether the
// address has an account, then branches:
// - it does: "password" (sign in)
// - it doesn't: "username" → "new-password" → "welcome" (sign up)
// "welcome" follows a successful sign-up (Figma "Welcome to Cheq"): the
// background merges to white, the tiles become the early-pass ticket, and
// Continue goes on to the dashboard.
export type AuthStep =
  | "email"
  | "password"
  | "username"
  | "new-password"
  | "welcome";

// The steps kept in the URL (?step=password). "welcome" isn't one: it only
// exists right after the account is created (a refresh there lands on the
// dashboard instead, as the user is signed in by then).
export const AUTH_URL_STEPS = [
  "email",
  "password",
  "username",
  "new-password",
] as const satisfies readonly AuthStep[];

type UrlStep = (typeof AUTH_URL_STEPS)[number];

// The step before each one (where Back goes)
export const AUTH_PREVIOUS_STEP: Partial<Record<UrlStep, UrlStep>> = {
  password: "email",
  username: "email",
  "new-password": "username",
};

// How each step looks (Figma: the email step grey; signing in, the colour
// frame; signing up, the colour frames with the circles lowered; welcome
// merges the circles to white over that, via AuthScene's `welcome`). The
// password step's "Welcome back" is the cue that the email has an account.
export const AUTH_SCENES: Record<
  AuthStep,
  { tone: AuthTone; arch: AuthArchMode; heading: string }
> = {
  email: { tone: "grey", arch: "arch", heading: "Welcome to Cheq" },
  password: { tone: "colour", arch: "dots", heading: "Welcome back" },
  username: { tone: "lowered", arch: "avatars", heading: "Username" },
  "new-password": { tone: "lowered", arch: "dots", heading: "Create Password" },
  welcome: { tone: "lowered", arch: "welcome", heading: "Welcome to Cheq" },
};
