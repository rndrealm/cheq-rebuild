"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { authClient, signIn, signUp } from "@/lib/auth-client";
import { AppRoutes } from "@/lib/routes";
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
  AUTH_FIELDS_KEY,
  replaceStoredFields,
  useStoredFields,
} from "@/components/auth/hooks/use-stored-fields";
import { AuthFooter, authFooterKey } from "./_components/auth-footer";
import { UsernameField } from "./_components/username-field";
import {
  AUTH_PREVIOUS_STEP,
  AUTH_SCENES,
  AUTH_URL_STEPS,
  type AuthStep,
} from "./steps";

const FORM_ID = "auth-form";
const ERROR_ID = "auth-error";

// Figma puts the welcome step's Continue at 496, 54px below where the slot
// under the (now empty) field starts
const WELCOME_CONTINUE_TOP = "top-[54px]";

// The new-password step shows its button once this many characters are typed
const PASSWORD_BUTTON_AFTER = 3;

// Better Auth's codes for signing up with a registered email
const EMAIL_TAKEN_CODES = new Set([
  "USER_ALREADY_EXISTS",
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
]);

// What the email step's check found: whether the address has an account
// (stored with the email, and cleared when it changes)
type Account = "" | "existing" | "new";

// "<lead> <email>" for the slot, shown whole: the line wraps before the email
// when it doesn't fit (the slot has room for two lines), and a very long
// address breaks anywhere rather than overflowing
function AsEmail({ lead, email }: { lead: string; email: string }) {
  return (
    <span className="line-clamp-2 [overflow-wrap:anywhere]">
      {lead} <span className="font-medium">{email}</span>
    </span>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const convex = useConvex();
  // The email, the username and what the check found are kept in session
  // storage (they survive a refresh or Back/Forward); passwords never are
  const {
    values: { email, username, account: storedAccount },
    setField,
  } = useStoredFields(AUTH_FIELDS_KEY, { email: "", username: "", account: "" });
  const account = storedAccount as Account;
  const [welcome, setWelcome] = useState(false);
  // The step is in the URL. Each branch needs the email checked and on that
  // branch; a later step needs the earlier ones' answers. The welcome step
  // needs nothing.
  const flow = useAuthStep(AUTH_URL_STEPS, {
    previous: AUTH_PREVIOUS_STEP,
    requires: (s) => {
      if (welcome || s === "email") return undefined;
      if (!isValidEmail(email)) return "email";
      if (s === "password") return account === "existing" ? undefined : "email";
      if (account !== "new") return "email";
      if (s === "new-password" && usernameReason(username)) return "username";
      return undefined;
    },
  });
  const step: AuthStep = welcome ? "welcome" : flow.step;
  const [password, setPassword] = useState("");
  const { error, setError } = useStepError<AuthStep>(step);
  const [loading, setLoading] = useState(false);
  const google = useGoogleSignIn(setError);
  // Shows the disabled button's reason after Enter on a password that doesn't
  // meet the rules yet
  const [reasonShown, flashReason] = useReasonFlash();

  // Each step's request. A result only moves the user on if they're still on
  // that step (not gone Back meanwhile); errors are filed under their step.
  // Returns true to keep the spinner on (the page is navigating away).

  // Signs in if the address has an account, signs up if not
  async function submitEmail() {
    const available = await convex.query(api.users.isEmailAvailable, { email });
    setField("account", available ? "new" : "existing");
    if (flow.isOn("email")) flow.go(available ? "username" : "password");
    return false;
  }

  async function submitPassword() {
    const result = await signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? "Sign in failed", "password");
      return false;
    }
    // Spinner on until the dashboard takes over. The stored email stays, so
    // it's offered again after sign-out.
    router.push(AppRoutes.home.path);
    return true;
  }

  async function submitUsername() {
    const { data, error } = await authClient.isUsernameAvailable({ username });
    if (error) {
      setError(error.message ?? "Couldn't check that username", "username");
    } else if (!data?.available) {
      setError("That username is taken", "username");
    } else if (flow.isOn("username")) {
      flow.go("new-password");
    }
    return false;
  }

  async function createAccount() {
    const result = await signUp.email({
      email,
      password,
      username,
      name: username,
    });
    if (result.error && EMAIL_TAKEN_CODES.has(result.error.code ?? "")) {
      // Registered since the email step's check: back to the email step,
      // where Continue checks again and goes on to sign in
      setPassword("");
      flow.backTo("email");
      setError("This email now has an account. Continue to sign in.", "email");
    } else if (result.error) {
      setError(result.error.message ?? "Sign up failed", "new-password");
    } else {
      // Signed up and signed in. Only the email is kept (an account now), so
      // it's offered after sign-out.
      replaceStoredFields(AUTH_FIELDS_KEY, { email, account: "existing" });
      setWelcome(true);
    }
    return false;
  }

  async function run(request: () => Promise<boolean>) {
    setError("");
    setLoading(true);
    let keepLoading = false;
    try {
      keepLoading = await request();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      if (!keepLoading) setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (welcome) {
      enterApp();
      return;
    }
    // Not valid yet: the new password shows its reason under its (faded)
    // button; the other steps have no button until they're valid, so the
    // browser's own message points at the field instead
    if (!e.currentTarget.checkValidity()) {
      if (step === "new-password") flashReason();
      else e.currentTarget.reportValidity();
      return;
    }
    if (step === "email") void run(submitEmail);
    else if (step === "password") void run(submitPassword);
    else if (step === "username") void run(submitUsername);
    else if (step === "new-password") void run(createAccount);
  }

  // Welcome's Continue: on to the dashboard, spinner on until it takes over
  function enterApp() {
    setLoading(true);
    router.push(AppRoutes.home.path);
  }

  function goBack() {
    // Not mid-request: its result would land on the step we'd gone back to
    if (loading || welcome) return;
    setPassword("");
    flow.back();
  }

  // The sign-up steps' "Change email": straight back to the email step
  function changeEmail() {
    if (loading) return;
    setPassword("");
    flow.backTo("email");
  }

  // Typing clears the last error. A changed email hasn't been checked.
  function onEmailChange(value: string) {
    setField("email", value);
    setField("account", "");
    setError("");
  }
  function change(set: (value: string) => void) {
    return (value: string) => {
      set(value);
      setError("");
    };
  }

  const errorId = error ? ERROR_ID : undefined;

  // What sits under the field: the error, or else per step:
  // - email: Continue once the email is valid, Google until then
  // - password: Sign in once something's typed; which account until then
  // - username: Continue once it's valid; which email is signing up until then
  // - new-password: the hint until 3 characters are typed, then Create
  //   account, faded with its reason (e.g. "Add a number") until it meets the
  //   rules
  // - welcome: its own lower Continue
  function slot() {
    if (error) {
      return (
        <SlotText key="error" role="alert" className="font-medium text-[#0b0b0b]">
          <span id={ERROR_ID}>{error}</span>
        </SlotText>
      );
    }
    switch (step) {
      case "welcome":
        // Same key as the new-password step's button, so it's the same button:
        // it slides down to its welcome spot instead of fading out and in
        return (
          <ContinueButton
            key="continue"
            form={FORM_ID}
            pending={loading}
            className={WELCOME_CONTINUE_TOP}
          />
        );
      case "email":
        if (loading || isValidEmail(email)) {
          return <ContinueButton key="continue" form={FORM_ID} pending={loading} />;
        }
        return (
          <GoogleButton key="google" onClick={google.start} pending={google.pending} />
        );
      case "password":
        if (loading || password) {
          return (
            <ContinueButton
              key="continue"
              form={FORM_ID}
              label="Sign in"
              pending={loading}
            />
          );
        }
        return (
          <SlotText key="signing-in-as">
            <AsEmail lead="Signing in as" email={email} />
          </SlotText>
        );
      case "username":
        if (loading || !usernameReason(username)) {
          return <ContinueButton key="continue" form={FORM_ID} pending={loading} />;
        }
        return (
          <SlotText key="signing-up-as">
            <AsEmail lead="Creating an account for" email={email} />
          </SlotText>
        );
      case "new-password":
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
  }

  return (
    <AuthScene
      {...AUTH_SCENES[step]}
      onBack={step === "email" || step === "welcome" ? undefined : goBack}
      error={!!error}
      welcome={welcome}
      footerKey={authFooterKey(step)}
      footer={<AuthFooter step={step} onChangeEmail={changeEmail} />}
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
                id="auth-email"
                value={email}
                onValueChange={onEmailChange}
                autoComplete="username"
                busy={loading}
                errorId={errorId}
              />
            </PillField>
          )}
          {step === "password" && (
            <PillField key="password">
              <PasswordField
                id="auth-password"
                email={email}
                value={password}
                onValueChange={change(setPassword)}
                autoComplete="current-password"
                onEscape={goBack}
                busy={loading}
                errorId={errorId}
              />
            </PillField>
          )}
          {step === "username" && (
            <PillField key="username">
              <UsernameField
                id="auth-username"
                value={username}
                onValueChange={change((v) => setField("username", v))}
                onEscape={goBack}
                busy={loading}
                errorId={errorId}
              />
            </PillField>
          )}
          {step === "new-password" && (
            <PillField key="new-password">
              <PasswordField
                id="auth-new-password"
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
