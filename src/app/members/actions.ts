"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearMemberSessionCookie, getCurrentMember, setMemberSessionCookie } from "@/lib/members/auth";
import { activateMember, authenticateMember, createMemberRequest, getMemberById, REQUEST_KINDS, setMemberPassword, updateMemberRequest, type RequestKind } from "@/lib/members/service";
import { memberSessionsConfigured, verifyPassword } from "@/lib/members/crypto";
import { safeNext } from "@/lib/members/safe-next";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export type ActionState = { error?: string; ok?: boolean };

const SESSION_SECRET_MISSING = "Member sign-in is not configured: SESSION_SECRET is not set. Add a long random value to your environment and restart.";

async function ip(): Promise<string> {
  return clientIp(await headers());
}

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!memberSessionsConfigured()) return { error: SESSION_SECRET_MISSING };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const addr = await ip();
  if (
    !rateLimit(`login:${addr}`, { limit: 12, windowMs: 15 * 60_000 }) ||
    !rateLimit(`login:${email}`, { limit: 8, windowMs: 15 * 60_000 }) ||
    !rateLimit("login:global", { limit: 120, windowMs: 15 * 60_000 })
  ) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }
  const res = await authenticateMember(email, password);
  if (!res.ok) return { error: res.error };
  await setMemberSessionCookie(res.value);
  redirect(safeNext(formData.get("next")));
}

export async function signOutAction(): Promise<void> {
  await clearMemberSessionCookie();
  redirect("/");
}

export async function activateAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const activationCode = String(formData.get("code") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password !== confirm) return { error: "Passwords don't match." };
  if (!memberSessionsConfigured()) return { error: SESSION_SECRET_MISSING };
  const addr = await ip();
  if (!rateLimit(`activate:${addr}`, { limit: 10, windowMs: 15 * 60_000 }) || !rateLimit("activate:global", { limit: 60, windowMs: 15 * 60_000 })) {
    return { error: "Too many attempts. Please wait a few minutes." };
  }
  const res = await activateMember({ email, activationCode, password });
  if (!res.ok) return { error: res.error };
  await setMemberSessionCookie(res.value);
  redirect("/members?welcome=1");
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await getCurrentMember();
  if (!member) redirect("/members/login?next=/members/account");
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!verifyPassword(current, member.passwordHash)) return { error: "Current password is incorrect." };
  if (password !== confirm) return { error: "New passwords don't match." };
  const res = await setMemberPassword(member.id, password);
  if (!res.ok) return { error: res.error };
  // Sessions are bound to the password hash, so re-issue this device's cookie; every other device is signed out.
  const updated = await getMemberById(member.id);
  if (updated) await setMemberSessionCookie(updated);
  return { ok: true };
}

export async function createRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const member = await getCurrentMember();
  if (!member) redirect("/members/login?next=/members");
  const kind = String(formData.get("kind") ?? "general") as RequestKind;
  if (!(kind in REQUEST_KINDS)) return { error: "Unknown request type." };
  const details = String(formData.get("details") ?? "").trim();
  if (details.length < 4) return { error: "Tell us a little more so the team can help." };
  if (!rateLimit(`request:${member.id}`, { limit: 10, windowMs: 60 * 60_000 })) return { error: "You've sent quite a few requests. The team will be in touch." };
  await createMemberRequest(member.id, kind, details);
  revalidatePath("/members");
  redirect("/members?requested=1");
}

export async function cancelRequestAction(formData: FormData): Promise<void> {
  const member = await getCurrentMember();
  if (!member) redirect("/members/login?next=/members");
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) {
    await updateMemberRequest(id, { status: "cancelled" }, { memberId: member.id });
  }
  revalidatePath("/members");
}
