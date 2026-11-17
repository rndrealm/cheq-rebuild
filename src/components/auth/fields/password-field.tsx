"use client";

import { HiddenUsername, pillInputProps } from "@/components/auth/auth-field";

/**
 * The password input for a pill (put it in a keyed PillField). Focuses itself
 * when its step opens, and carries the email for password managers to pair
 * with. `autoComplete`: "current-password" to sign in, "new-password" to
 * create an account. Escape calls `onEscape` (the step's back).
 */
export function PasswordField({
  id,
  email,
  value,
  onValueChange,
  autoComplete,
  minLength,
  pattern,
  onEscape,
  busy,
  errorId,
}: {
  id: string;
  email: string;
  value: string;
  onValueChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  // The rules for a new password (sign-up); none when signing in
  minLength?: number;
  pattern?: string;
  onEscape?: () => void;
  busy?: boolean;
  errorId?: string;
}) {
  return (
    <>
      <HiddenUsername email={email} />
      <label htmlFor={id} className="sr-only">
        Password
      </label>
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        autoFocus
        required
        minLength={minLength}
        pattern={pattern}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onEscape?.();
        }}
        placeholder="Enter password"
        {...pillInputProps({ busy, errorId })}
      />
    </>
  );
}
