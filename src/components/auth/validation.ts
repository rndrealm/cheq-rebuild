// What makes an auth field valid, and the reason shown on the disabled button
// when it isn't yet (undefined when it is). Keep the HTML attributes on the
// fields (type, pattern, minLength) in step with these: the form checks those
// on submit.

export const EMAIL_REASON = "Enter a valid email address";

// Whether an address passes the browser's own email check (the one
// type="email" fields use). False on the server, which has no DOM.
export function isValidEmail(value: string) {
  if (!value || typeof document === "undefined") return false;
  const probe = document.createElement("input");
  probe.type = "email";
  probe.value = value;
  return probe.validity.valid;
}

export const emailReason = (value: string) =>
  isValidEmail(value) ? undefined : EMAIL_REASON;

// Better Auth's username plugin allows 3-30 of letters, digits, _ and . We
// also keep a dot off either end, so the handle never reads "ola..cheq".
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = "[A-Za-z0-9_][A-Za-z0-9_.]{1,28}[A-Za-z0-9_]";

// One rule at a time, mirroring USERNAME_PATTERN
export function usernameReason(value: string) {
  if (value.length < USERNAME_MIN_LENGTH) return "At least 3 characters";
  if (/[^A-Za-z0-9_.]/.test(value)) return "Only letters, numbers, _ and .";
  if (value.startsWith(".") || value.endsWith("."))
    return "Can't start or end with a dot";
  return undefined;
}

export const MIN_PASSWORD_LENGTH = 8;

export const passwordReason = (value: string) =>
  value.length < MIN_PASSWORD_LENGTH
    ? `At least ${MIN_PASSWORD_LENGTH} characters`
    : undefined;
