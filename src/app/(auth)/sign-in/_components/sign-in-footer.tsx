import Link from "next/link";
import { AppRoutes } from "@/lib/routes";
import type { SignInStep } from "../steps";

/**
 * Sign-in's footer: a link to sign up on the email step; "Forgot Password?"
 * on the password step (Figma; not wired to a reset flow yet).
 */
export function SignInFooter({ step }: { step: SignInStep }) {
  if (step === "password") {
    return (
      <button
        type="button"
        className="mx-auto block w-70.25 max-w-full rounded-[40px] px-2.5 py-3.75 text-sm leading-4 font-semibold text-white outline-none"
      >
        Forgot Password?
      </button>
    );
  }

  return (
    <>
      Don&apos;t have an account?{" "}
      <Link href={AppRoutes.signUp.path} className="font-medium underline outline-none">
        Sign up
      </Link>
    </>
  );
}
