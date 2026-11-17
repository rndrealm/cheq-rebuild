// What makes an auth field valid. Keep the HTML attributes on the fields
// (type, pattern, minLength) in step with these: the form checks those on
// submit. The "reason" helpers return why a value isn't valid yet (undefined
// when it is); the password's is shown on its faded button.

// The browser's own type="email" check only asks for "something@something"
// ("you@g" passes), as the HTML standard allows single-label domains. On top
// of it we require a dot and at least two characters after it in the domain
// ("gmail.com", "x.co"), which the server's check on sign-up wants too. Used
// as the email field's `pattern`, so the field's own validity (what the form
// checks on submit) and isValidEmail always agree.
export const EMAIL_PATTERN = "[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}";

// Whether an address passes the email field's checks (type="email" plus
// EMAIL_PATTERN). False on the server, which has no DOM.
export function isValidEmail(value: string) {
  if (!value || typeof document === "undefined") return false;
  const probe = document.createElement("input");
  probe.type = "email";
  probe.pattern = EMAIL_PATTERN;
  probe.value = value;
  return probe.validity.valid;
}

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

// A new password (sign-up only; sign-in takes whatever the account has):
// at least 8 characters (also Better Auth's own minimum), with an uppercase
// letter and a number. As a `pattern` for the field too, so pressing Enter
// checks the same rules.
export const MIN_PASSWORD_LENGTH = 8;
export const NEW_PASSWORD_PATTERN = `(?=.*[A-Z])(?=.*[0-9]).{${MIN_PASSWORD_LENGTH},}`;

// One rule at a time, mirroring NEW_PASSWORD_PATTERN: the first one missing
export function passwordReason(value: string) {
  if (value.length < MIN_PASSWORD_LENGTH)
    return `At least ${MIN_PASSWORD_LENGTH} characters`;
  if (!/[A-Z]/.test(value)) return "Add an uppercase letter";
  if (!/[0-9]/.test(value)) return "Add a number";
  return undefined;
}
