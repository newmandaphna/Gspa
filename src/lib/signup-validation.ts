import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import zipcodes from "zipcodes";

export const SIGNUP_PREFIX = "Membership list (pre-opening)";

export function maskSignupPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// Syntax only: this does not establish that a mailbox exists or accepts mail.
export function validSignupEmail(value: string): boolean {
  const email = value.trim();
  if (email.length > 120) return false;
  const match = /^([A-Za-z0-9_+%'-]+(?:\.[A-Za-z0-9_+%'-]+)*)@([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+)$/.exec(email);
  return !!match && match[1].length <= 64 && /[A-Za-z]{2,}$/.test(match[2]);
}

// Local ZIP data only; assigned in the bundled dataset, not live USPS verification.
export function validSignupZip(value: string): boolean {
  return /^[0-9]{5}$/.test(value) && zipcodes.lookup(value)?.country === "US";
}

export function formatSignupPhone(value: string): string | null {
  if (!value.trim()) return "";
  // libphonenumber accepts vanity numbers, but this form deliberately rejects letters.
  if (!/^(?:\+?1[\s.()-]*)?[0-9\s.()-]+$/.test(value.trim())) return null;
  const parsed = parsePhoneNumberFromString(value, "US");
  return parsed?.country === "US" && parsed.isValid() ? parsed.formatNational() : null;
}