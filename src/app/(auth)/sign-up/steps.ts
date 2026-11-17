import type { AuthTone } from "@/components/auth/visuals/auth-background";
import type { AuthArchMode } from "@/components/auth/visuals/auth-arch";

// "welcome" follows a successful sign-up (Figma "Welcome to Cheq"): the
// background merges to white, the tiles become the early-pass ticket, and
// Continue goes on to the dashboard
export type SignUpStep = "email" | "username" | "password" | "welcome";

// The steps kept in the URL (?step=password), in order. "welcome" isn't one:
// it only exists right after the account is created (a refresh there lands on
// the dashboard instead, as the user is signed in by then).
export const SIGN_UP_URL_STEPS = [
  "email",
  "username",
  "password",
] as const satisfies readonly SignUpStep[];

// How each step looks (Figma: the email step grey as on sign-in; username and
// password the colour frames with the circles lowered; welcome merges the
// circles to white over that, via AuthScene's `welcome`)
export const SIGN_UP_SCENES: Record<
  SignUpStep,
  { tone: AuthTone; arch: AuthArchMode; heading: string }
> = {
  email: { tone: "grey", arch: "arch", heading: "Welcome to Cheq" },
  username: { tone: "lowered", arch: "avatars", heading: "Username" },
  password: { tone: "lowered", arch: "dots", heading: "Create Password" },
  welcome: { tone: "lowered", arch: "welcome", heading: "Welcome to Cheq" },
};
