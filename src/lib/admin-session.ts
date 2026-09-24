import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Signed, expiring front-desk session tokens: "<exp>.<hmac>". Pure (no
 * Next.js imports) so it is unit-testable; src/lib/auth.ts owns the cookie.
 *
 * Key: SESSION_SECRET when set (shared with member sessions). Otherwise a key
 * is derived from ADMIN_PASSWORD with scrypt, so a leaked cookie is never a
 * fast-hash oracle for the password. The derived key is cached per process.
 */

export const ADMIN_SESSION_TTL_SEC = 60 * 60 * 12;

let derived: { password: string; key: Buffer } | null = null;

function adminSessionKey(): Buffer | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return Buffer.from(secret);
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  if (!derived || derived.password !== password) {
    derived = { password, key: scryptSync(password, "gunspa-admin-session-kdf-v2", 32, { N: 16384 }) };
  }
  return derived.key;
}

function sign(exp: number, key: Buffer): string {
  return createHmac("sha256", key).update(`admin.${exp}`).digest("base64url");
}

export function signAdminSession(nowSec: number = Math.floor(Date.now() / 1000), ttlSec: number = ADMIN_SESSION_TTL_SEC): string {
  const key = adminSessionKey();
  if (!key) throw new Error("ADMIN_PASSWORD or SESSION_SECRET must be set to sign admin sessions");
  const exp = nowSec + ttlSec;
  return `${exp}.${sign(exp, key)}`;
}

/** True only for a token with a valid signature that has not expired. */
export function verifyAdminSession(token: string | undefined | null, nowSec: number = Math.floor(Date.now() / 1000)): boolean {
  if (!token) return false;
  const key = adminSessionKey();
  if (!key) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp)) return false;
  const expected = Buffer.from(sign(exp, key));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  return exp >= nowSec;
}
