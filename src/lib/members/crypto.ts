import { createHash, createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Pure crypto helpers for member accounts (no Next.js imports so they are
 * unit-testable). Passwords use scrypt from node:crypto — no native deps.
 */

const SCRYPT_N = 16384;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password.normalize("NFKC"), salt, KEYLEN, { N: SCRYPT_N }).toString("hex");
  return `scrypt$${SCRYPT_N}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [algo, nStr, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const N = Number(nStr) || SCRYPT_N;
  const candidate = scryptSync(password.normalize("NFKC"), salt, KEYLEN, { N });
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** One-time activation code shown to staff and handed to the new member: "K7MP-2Q9X". */
export function generateActivationCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) s += "-";
    s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return s;
}

export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^(.{4})(.{4})$/, "$1-$2");
}

/**
 * The member-session signing key is SESSION_SECRET and nothing else in
 * production: never ADMIN_PASSWORD (every member holds a signed token, which
 * would make the admin password an offline brute-force target) and never a
 * string from the repository. Development and tests get a fixed dev key.
 */
function sessionSecret(): string | null {
  const s = process.env.SESSION_SECRET?.trim();
  if (s) return s;
  return process.env.NODE_ENV === "production" ? null : "dev-insecure-session-secret-change-me";
}

/** False when member sign-in cannot issue sessions (SESSION_SECRET missing in production). */
export function memberSessionsConfigured(): boolean {
  return sessionSecret() !== null;
}

export const MEMBER_SESSION_TTL_SEC = 30 * 24 * 60 * 60;

/** Short fingerprint of the password hash: changes on every password set, so old sessions die with the old password. */
export function passwordFingerprint(passwordHash: string | null | undefined): string {
  return createHash("sha256")
    .update(passwordHash ?? "")
    .digest("base64url")
    .slice(0, 12);
}

/**
 * Stateless signed token: "<memberId>.<exp>.<fingerprint>.<hmac>". Revocation
 * is the member status check on read plus the password fingerprint, so a
 * password change (or re-activation) invalidates sessions on other devices.
 */
export function signMemberSession(memberId: number, passwordHash: string | null | undefined, nowSec: number = Math.floor(Date.now() / 1000), ttlSec: number = MEMBER_SESSION_TTL_SEC): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is not set; member sessions cannot be issued");
  const exp = nowSec + ttlSec;
  const payload = `${memberId}.${exp}.${passwordFingerprint(passwordHash)}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export type MemberSessionClaims = { id: number; fingerprint: string };

/** Returns the claims for a valid, unexpired token, else null. Never throws, so public pages that probe the cookie keep working. */
export function verifyMemberSession(token: string | undefined | null, nowSec: number = Math.floor(Date.now() / 1000)): MemberSessionClaims | null {
  if (!token) return null;
  const secret = sessionSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [idStr, expStr, fingerprint, sig] = parts;
  const payload = `${idStr}.${expStr}.${fingerprint}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const exp = Number(expStr);
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(exp) || exp < nowSec) return null;
  return { id, fingerprint };
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "Password is too long.";
  return null;
}
