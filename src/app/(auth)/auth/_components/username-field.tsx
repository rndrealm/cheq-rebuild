"use client";

import { RenderIf } from "@/components/ui/render-if";
import { pillInputProps } from "@/components/auth/auth-field";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from "@/components/auth/validation";

// Every handle reads "<username>.cheq" (only the username part is stored)
const USERNAME_SUFFIX = ".cheq";

/**
 * The username input for the new-account pill (put it in a keyed PillField), with
 * the ".cheq" suffix shown right after what's typed. Focuses itself when its
 * step opens; Escape calls `onEscape` (the step's back).
 */
export function UsernameField({
  id,
  value,
  onValueChange,
  onEscape,
  busy,
  errorId,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  onEscape?: () => void;
  busy?: boolean;
  errorId?: string;
}) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        Username
      </label>
      <input
        id={id}
        type="text"
        // Not "username": to the browser that's the login name, which here is
        // the email, so it would autofill the email into it
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        required
        minLength={USERNAME_MIN_LENGTH}
        maxLength={USERNAME_MAX_LENGTH}
        pattern={USERNAME_PATTERN}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onEscape?.();
        }}
        placeholder={`Username${USERNAME_SUFFIX}`}
        {...pillInputProps({ busy, errorId })}
      />
      {/* The handle as it'll read: what's typed, then ".cheq". The typed part
          is invisible here (the input shows it); it only pushes the suffix
          along to sit right after the text. */}
      <RenderIf condition={!!value}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-7 text-sm leading-4 font-medium whitespace-pre"
        >
          <span className="invisible">{value}</span>
          <span className={errorId ? "text-[#0b0b0b]/50" : "text-white/50"}>
            {USERNAME_SUFFIX}
          </span>
        </div>
      </RenderIf>
    </>
  );
}
