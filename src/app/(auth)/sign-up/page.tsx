"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { authClient, signUp } from "@/lib/auth-client";
import { AppRoutes } from "@/lib/routes";
import { RenderIf } from "@/components/ui/render-if";
import { AuthScene } from "@/components/auth/auth-scene";
import { AuthPill, EnterSubmits, PillField } from "@/components/auth/auth-field";
import { AuthSlot, SlotText } from "@/components/auth/auth-slot";
import { ContinueButton } from "@/components/auth/continue-button";
import { GoogleButton } from "@/components/auth/google-button";
import { EmailField } from "@/components/auth/fields/email-field";
import { PasswordField } from "@/components/auth/fields/password-field";
import {
  MIN_PASSWORD_LENGTH,
  NEW_PASSWORD_PATTERN,
  isValidEmail,
  passwordReason,
  usernameReason,
} from "@/components/auth/validation";
import { useAuthStep } from "@/components/auth/hooks/use-auth-step";
import { useGoogleSignIn } from "@/components/auth/hooks/use-google-sign-in";
import { useReasonFlash } from "@/components/auth/hooks/use-reason-flash";
import { useStepError } from "@/components/auth/hooks/use-step-error";
import {
  SIGN_UP_FIELDS_KEY,
  clearStoredFields,
  handOffEmailToSignIn,
  useStoredFields,
} from "@/components/auth/hooks/use-stored-fields";
import { SignUpFooter } from "./_components/sign-up-footer";
import { UsernameField } from "./_components/username-field";
import { SIGN_UP_SCENES, SIGN_UP_URL_STEPS, type SignUpStep } from "./steps";

const FORM_ID = "sign-up-form";
const ERROR_ID = "sign-up-error";

// Figma puts the welcome step's Continue at 496, 54px below where the slot
// under the (now empty) field starts
const WELCOME_CONTINUE_TOP = "top-[54px]";

// The password step shows its button once this many characters are typed
const PASSWORD_BUTTON_AFTER = 3;

const EMAIL_TAKEN = "An account with this email already exists";
// Better Auth's codes for signing up with a registered email
const EMAIL_TAKEN_CODES = new Set([
  "USER_ALREADY_EXISTS",
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
]);

export default function SignUpPage() {
  const router = useRouter();
  const convex = useConvex();
  // Email and username are kept in session storage (they survive a refresh or
  // Back/Forward); the password is never stored
  const {
    values: { email, username },
    setField,
  } = useStoredFields(SIGN_UP_FIELDS_KEY, { email: "", username: "" });
  const [welcome, setWelcome] = useState(false);
  // The step is in the URL. A later step needs the earlier ones' answers;
  // the welcome step needs nothing (and the stored fields are cleared there).
  const flow = useAuthStep(SIGN_UP_URL_STEPS, (s) => {
    if (welcome) return undefined;
    if (s !== "email" && !isValidEmail(email)) return "email";
    if (s === "password" && usernameReason(username)) return "username";
    return undefined;
  });
  const step: SignUpStep = welcome ? "welcome" : flow.step;
  const [password, setPassword] = useState("");
  const { error, setError } = useStepError<SignUpStep>(step);
  const [loading, setLoading] = useState(false);
  const google = useGoogleSignIn(setError);
  // Shows the disabled button's reason after Enter on a field not valid yet
  const [reasonShown, flashReason] = useReasonFlash();

  // Each step's request. A result only moves the user on if they're still on
  // that step (not gone Back meanwhile); errors are filed under their step.

  // Catch an address that's already registered now, not after the user has
  // picked a username and password
  async function submitEmail() {
    const available = await convex.query(api.users.isEmailAvailable, { email });
    if (!available) setError(EMAIL_TAKEN, "email");
    else if (flow.isOn("email")) flow.go("username");
  }

  async function submitUsername() {
    const { data, error } = await authClient.isUsernameAvailable({ username });
    if (error) {
      setError(error.message ?? "Couldn't check that username", "username");
    } else if (!data?.available) {
      setError("That username is taken", "username");
    } else if (flow.isOn("username")) {
      flow.go("password");
    }
  }

  async function createAccount() {
    const result = await signUp.email({
      email,
      password,
      username,
      name: username,
    });
    if (result.error && EMAIL_TAKEN_CODES.has(result.error.code ?? "")) {
      // Registered since the email step's check: back through history to the
      // email step, with the message there, where it can be fixed
      flow.backTo("email");
      setError(EMAIL_TAKEN, "email");
    } else if (result.error) {
      setError(result.error.message ?? "Sign up failed", "password");
    } else {
      // Signed up and signed in. Sign-in remembers the last account's email;
      // this is the last account now, so it's the one offered after sign-out.
      handOffEmailToSignIn(email);
      setWelcome(true);
    }
  }

  async function run(request: () => Promise<void>) {
    setError("");
    setLoading(true);
    try {
      await request();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (welcome) {
      enterApp();
      return;
    }
    // Not valid yet: the password step shows its reason under its (faded)
    // button; the email and username steps have no button until they're
    // valid, so the browser's own message points at the field instead
    if (!e.currentTarget.checkValidity()) {
      if (step === "password") flashReason();
      else e.currentTarget.reportValidity();
      return;
    }
    if (step === "email") void run(submitEmail);
    else if (step === "username") void run(submitUsername);
    else if (step === "password") void run(createAccount);
  }

  // Welcome's Continue: on to the dashboard, spinner on until it takes over.
  // The answers kept for refreshes aren't needed any more.
  function enterApp() {
    clearStoredFields(SIGN_UP_FIELDS_KEY);
    setLoading(true);
    router.push(AppRoutes.home.path);
  }

  function goBack() {
    // Not mid-request: its result would land on the step we'd gone back to
    if (loading || welcome) return;
    if (step === "password") setPassword("");
    flow.back();
  }

  // Typing clears the last error
  function change(set: (value: string) => void) {
    return (value: string) => {
      set(value);
      setError("");
    };
  }

  const errorId = error ? ERROR_ID : undefined;

  // What sits under the field: the error, or else per step:
  // - email: Continue once the email is valid, Google until then
  // - username: Continue once it's valid, nothing until then
  // - password: the button once 3 characters are typed, faded with its
  //   reason (e.g. "Add a number") until it meets the rules; the hint before
  //   that
  // - welcome: its own lower Continue
  function slot() {
    if (error) {
      return (
        <SlotText key="error" role="alert" className="font-medium">
          <span id={ERROR_ID}>
            {error}
            <RenderIf condition={error === EMAIL_TAKEN}>
              {" "}
              <Link
                href={AppRoutes.signIn.path}
                onClick={() => handOffEmailToSignIn(email)}
                className="underline outline-none"
              >
                Sign in instead
              </Link>
            </RenderIf>
          </span>
        </SlotText>
      );
    }
    if (step === "welcome") {
      // Same key as the password step's button, so it's the same button: it
      // slides down to its welcome spot instead of fading out and back in
      return (
        <ContinueButton
          key="continue"
          form={FORM_ID}
          pending={loading}
          className={WELCOME_CONTINUE_TOP}
        />
      );
    }
    if (step === "password") {
      // The hint until a few characters are in, so the button (and its
      // reasons) doesn't jump in on the very first keystroke
      if (!loading && password.length < PASSWORD_BUTTON_AFTER) {
        return (
          <SlotText key="password-hint" className="whitespace-nowrap">
            This grants you access to your account
          </SlotText>
        );
      }
      return (
        <ContinueButton
          key="continue"
          form={FORM_ID}
          label="Create account"
          pending={loading}
          disabledReason={passwordReason(password)}
          reasonShown={reasonShown}
        />
      );
    }
    const valid =
      step === "email" ? isValidEmail(email) : !usernameReason(username);
    if (loading || valid) {
      return <ContinueButton key="continue" form={FORM_ID} pending={loading} />;
    }
    if (step === "email") {
      return (
        <GoogleButton key="google" onClick={google.start} pending={google.pending} />
      );
    }
    return null;
  }

  return (
    <AuthScene
      {...SIGN_UP_SCENES[step]}
      onBack={step === "username" || step === "password" ? goBack : undefined}
      error={!!error}
      welcome={welcome}
      footerKey={welcome ? "legal" : "links"}
      footer={<SignUpFooter welcome={welcome} />}
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        // Validation is ours (see handleSubmit), not the browser's tooltip
        noValidate
        className="w-full"
        aria-busy={loading}
      >
        {/* The welcome step has no field: the pill drops its glass */}
        <AuthPill error={!!error} glass={!welcome}>
          {step === "email" && (
            <PillField key="email">
              <EmailField
                id="sign-up-email"
                value={email}
                onValueChange={change((v) => setField("email", v))}
                autoComplete="email"
                busy={loading}
                errorId={errorId}
              />
            </PillField>
          )}
          {step === "username" && (
            <PillField key="username">
              <UsernameField
                id="sign-up-username"
                value={username}
                onValueChange={change((v) => setField("username", v))}
                onEscape={goBack}
                busy={loading}
                errorId={errorId}
              />
            </PillField>
          )}
          {step === "password" && (
            <PillField key="password">
              <PasswordField
                id="sign-up-password"
                email={email}
                value={password}
                onValueChange={change(setPassword)}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                pattern={NEW_PASSWORD_PATTERN}
                onEscape={goBack}
                busy={loading}
                errorId={errorId}
              />
            </PillField>
          )}
        </AuthPill>
        <EnterSubmits />
      </form>

      <AuthSlot>{slot()}</AuthSlot>
    </AuthScene>
  );
}
