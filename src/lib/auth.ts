import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SITE } from "@/lib/config/site";

const COOKIE = "gs_admin";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function sessionToken(): string {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "").update("gunspa-admin-session-v1").digest("hex");
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 6);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return Boolean(value) && safeEqual(value!, sessionToken());
}

export function checkAdminPassword(password: string): boolean {
  return adminConfigured() && safeEqual(password, process.env.ADMIN_PASSWORD!);
}

export async function setAdminSession(): Promise<void> {
  (await cookies()).set(COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: SITE.url.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
