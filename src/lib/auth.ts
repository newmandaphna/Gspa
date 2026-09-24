import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_TTL_SEC, signAdminSession, verifyAdminSession } from "@/lib/admin-session";

const COOKIE = "gs_admin";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 6);
}

/**
 * Session cookies carry Secure in production regardless of how the public
 * URL is configured; behind Replit's TLS edge the browser sees https.
 */
export function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return verifyAdminSession(value);
}

/**
 * Guard for every protected admin page. Layouts are not an auth boundary in
 * Next.js (a crafted RSC request can render a page segment alone), so each
 * page calls this as its first statement.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export function checkAdminPassword(password: string): boolean {
  return adminConfigured() && safeEqual(password, process.env.ADMIN_PASSWORD!);
}

export async function setAdminSession(): Promise<void> {
  (await cookies()).set(COOKIE, signAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SEC,
  });
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
