import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

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

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? "dev-insecure-session-secret-change-me";
}

export const MEMBER_SESSION_TTL_SEC = 30 * 24 * 60 * 60;

/** Stateless signed token: "<memberId>.<exp>.<hmac>". Revocation = member status check on read. */
export function signMemberSession(memberId: number, nowSec: number = Math.floor(Date.now() / 1000), ttlSec: number = MEMBER_SESSION_TTL_SEC): string {
  const exp = nowSec + ttlSec;
  const payload = `${memberId}.${exp}`;
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyMemberSession(token: string | undefined | null, nowSec: number = Math.floor(Date.now() / 1000)): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [idStr, expStr, sig] = parts;
  const payload = `${idStr}.${expStr}`;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const exp = Number(expStr);
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(exp) || exp < nowSec) return null;
  return id;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "Password is too long.";
  return null;
}
