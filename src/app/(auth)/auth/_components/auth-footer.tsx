import type { AuthStep } from "../steps";

const footerButton = "cursor-pointer font-medium underline outline-none";

/**
 * The auth flow's footer, per step:
 * - email: the terms line
 * - password: "Forgot Password?" (Figma; not wired to a reset flow yet)
 * - username / new-password: a way back to the email, for a mistyped address
 *   that landed on sign-up instead of sign-in
 * - welcome: the legal disclaimer (Figma), grey on the white page
 */
export function AuthFooter({
  step,
  onChangeEmail,
}: {
  step: AuthStep;
  onChangeEmail: () => void;
}) {
  if (step === "welcome") {
    return (
      <p className="mx-auto max-w-[432px] text-xs leading-[15px] text-[#8c8c8c]">
        Cheq is a technology and skill-based gaming platform, not a bank or
        licensed financial institution. Funds held in your Cheq wallet are
        subject to our{" "}
        <span className="font-medium text-[#0b0b0b] underline">
          Terms of Service
        </span>{" "}
        and are not insured against match losses. Participation is strictly
        limited to users 18 years of age or older in eligible jurisdictions.
      </p>
    );
  }

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

  if (step === "username" || step === "new-password") {
    return (
      <p>
        Meant to sign in?{" "}
        <button type="button" onClick={onChangeEmail} className={footerButton}>
          Change email
        </button>
      </p>
    );
  }

  return (
    <p>
      By continuing you agree to our{" "}
      <span className="font-medium underline">Terms of service</span>
    </p>
  );
}

// Which footer a step shows, for AuthScene's `footerKey` (the sign-up steps
// share one, so it stays put between them)
export function authFooterKey(step: AuthStep) {
  return step === "username" || step === "new-password" ? "new" : step;
}
