"use client";

import { pillInputProps } from "@/components/auth/auth-field";
import { EMAIL_PATTERN } from "@/components/auth/validation";

/**
 * The email input for a pill (put it in a keyed PillField). `autoComplete`:
 * "username" where the email is the login name (sign-in), "email" where a new
 * account is being made (sign-up).
 */
export function EmailField({
  id,
  value,
  onValueChange,
  autoComplete,
  busy,
  errorId,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  autoComplete: "username" | "email";
  busy?: boolean;
  errorId?: string;
}) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <input
        id={id}
        type="email"
        // Stricter than type="email" alone: the domain needs a dot and an
        // ending (see EMAIL_PATTERN)
        pattern={EMAIL_PATTERN}
        title="An email like you@example.com"
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Enter email Address"
        {...pillInputProps({ busy, errorId })}
      />
    </>
  );
}
