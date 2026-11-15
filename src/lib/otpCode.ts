// The 6-digit e-mail code fields (sign-up and returning sign-in). Copying the code from an e-mail, mostly on a
// phone, often brings a space, a line break or the words around it; the field cut the paste to 6 characters as
// is, so " 123456" became " 12345" and the code was rejected. Only digits are kept: a 6-digit run inside the
// pasted text wins, otherwise all its digits in order.
// No look-behind in the pattern: older iPhones (Safari before 16.4) cannot parse it, and the whole page would fail.
export function codeFromPaste(text: string): string {
  const run = text.match(/(^|\D)(\d{6})(?!\d)/);
  return (run ? run[2] : text.replace(/\D/g, "")).slice(0, 6);
}

export const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 6);
