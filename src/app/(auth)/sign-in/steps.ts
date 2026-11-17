import type { AuthTone } from "@/components/auth/visuals/auth-background";
import type { AuthArchMode } from "@/components/auth/visuals/auth-arch";

export type SignInStep = "email" | "password";

// In order; the step lives in the URL (?step=password)
export const SIGN_IN_STEPS = ["email", "password"] as const satisfies readonly SignInStep[];

// How each step looks: the same screens as sign-up's, with the grey
// background for the email step and the colour one for the password step
export const SIGN_IN_SCENES: Record<
  SignInStep,
  { tone: AuthTone; arch: AuthArchMode; heading: string }
> = {
  email: { tone: "grey", arch: "arch", heading: "Welcome back" },
  password: { tone: "colour", arch: "dots", heading: "Enter Password" },
};
