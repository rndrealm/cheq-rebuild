"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { AppRoutes } from "@/lib/routes";
import { AuthScene } from "@/components/auth/auth-scene";
import { AuthPill, EnterSubmits, PillField } from "@/components/auth/auth-field";
import { AuthSlot, SlotText } from "@/components/auth/auth-slot";
import { ContinueButton } from "@/components/auth/continue-button";
import { GoogleButton } from "@/components/auth/google-button";
import { EmailField } from "@/components/auth/fields/email-field";
import { PasswordField } from "@/components/auth/fields/password-field";
import { emailReason, isValidEmail } from "@/components/auth/validation";
import { useAuthStep } from "@/components/auth/hooks/use-auth-step";
import { useGoogleSignIn } from "@/components/auth/hooks/use-google-sign-in";
import { useReasonFlash } from "@/components/auth/hooks/use-reason-flash";
import { useStepError } from "@/components/auth/hooks/use-step-error";
import {
  SIGN_IN_FIELDS_KEY,
  useStoredFields,
} from "@/components/auth/hooks/use-stored-fields";
import { SignInFooter } from "./_components/sign-in-footer";
import { SIGN_IN_SCENES, SIGN_IN_STEPS } from "./steps";

const FORM_ID = "sign-in-form";
const ERROR_ID = "sign-in-error";

export default function SignInPage() {
  const router = useRouter();
  // The email is kept in session storage (it survives a refresh, and arrives
  // from sign-up's "Sign in instead"); the password is never stored
  const {
    values: { email },
    setField,
  } = useStoredFields(SIGN_IN_FIELDS_KEY, { email: "" });
  // The step is in the URL; the password step needs an email
  const { step, go, back } = useAuthStep(SIGN_IN_STEPS, (s) =>
    s === "password" && !isValidEmail(email) ? "email" : undefined,
  );
  const [password, setPassword] = useState("");
  const { error, setError } = useStepError(step);
  const [loading, setLoading] = useState(false);
  const google = useGoogleSignIn(setError);
  // Shows the disabled button's reason after Enter on an email not valid yet
  const [reasonShown, flashReason] = useReasonFlash();

  async function signInWithPassword() {
    setError("");
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Sign in failed");
        setLoading(false);
        return;
      }
      // Stay loading (spinner on) until the dashboard takes over, so the
      // button doesn't flash back in the meantime
      router.push(AppRoutes.home.path);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    // The form skips the browser's own validation (its grey tooltip doesn't
    // fit the design), so check here: not valid yet, show the reason instead
    if (!e.currentTarget.checkValidity()) {
      flashReason();
      return;
    }
    if (step === "email") go("password");
    else void signInWithPassword();
  }

  function goBack() {
    // Not mid-request: its result would land on the email step
    if (loading) return;
    setPassword("");
    back();
  }

  // Typing clears the last error
  function changeEmail(value: string) {
    setField("email", value);
    setError("");
  }
  function changePassword(value: string) {
    setPassword(value);
    setError("");
  }

  const errorId = error ? ERROR_ID : undefined;

  // What sits under the field: the error; the step's button once there's
  // something in the field; otherwise Google (email) or which account this is
  // (password)
  function slot() {
    if (error) {
      return (
        <SlotText key="error" role="alert" className="font-medium">
          <span id={ERROR_ID}>{error}</span>
        </SlotText>
      );
    }
    if (step === "email" && email) {
      return (
        <ContinueButton
          key="continue"
          form={FORM_ID}
          disabledReason={emailReason(email)}
          reasonShown={reasonShown}
        />
      );
    }
    if (step === "email") {
      return (
        <GoogleButton key="google" onClick={google.start} pending={google.pending} />
      );
    }
    if (loading || password) {
      return (
        <ContinueButton key="continue" form={FORM_ID} label="Sign in" pending={loading} />
      );
    }
    return (
      <SlotText key="hint">
        <span className="truncate">Signing in as {email}</span>
      </SlotText>
    );
  }

  return (
    <AuthScene
      {...SIGN_IN_SCENES[step]}
      onBack={step === "password" ? goBack : undefined}
      error={!!error}
      footerKey={step}
      footer={<SignInFooter step={step} />}
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        // Validation is ours (see handleSubmit), not the browser's tooltip
        noValidate
        className="w-full"
        aria-busy={loading}
      >
        <AuthPill error={!!error}>
          {step === "email" ? (
            <PillField key="email">
              <EmailField
                id="sign-in-email"
                value={email}
                onValueChange={changeEmail}
                autoComplete="username"
                errorId={errorId}
              />
            </PillField>
          ) : (
            <PillField key="password">
              <PasswordField
                id="sign-in-password"
                email={email}
                value={password}
                onValueChange={changePassword}
                autoComplete="current-password"
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
