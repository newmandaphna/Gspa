"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminConfigured, checkAdminPassword, clearAdminSession, requireAdmin, setAdminSession } from "@/lib/auth";
import { adminSetStatus } from "@/lib/booking";
import { TIERS, type TierKey } from "@/lib/config/site";
import { createMember, regenerateActivation, updateMember, updateMemberRequest } from "@/lib/members/service";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export type AdminActionState = { error?: string; ok?: boolean; code?: string };

export async function adminLoginAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!adminConfigured()) return { error: "ADMIN_PASSWORD is not set (or is shorter than 6 characters). Add it to your environment and restart." };
  const addr = clientIp(await headers());
  // One shared password, so the per-address bucket alone is not enough: a global bucket caps guessing from any number of addresses.
  if (!rateLimit(`admin-login:${addr}`, { limit: 8, windowMs: 15 * 60_000 }) || !rateLimit("admin-login:global", { limit: 30, windowMs: 15 * 60_000 })) {
    return { error: "Too many attempts. Wait a few minutes." };
  }
  const password = String(formData.get("password") ?? "");
  if (!checkAdminPassword(password)) {
    await new Promise((r) => setTimeout(r, 500));
    return { error: "Incorrect password." };
  }
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function setBookingStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "");
  if (!Number.isInteger(id) || id <= 0) return;
  const patch: { status?: string; paymentStatus?: string } = {};
  if (["confirmed", "cancelled"].includes(status)) patch.status = status;
  if (["paid", "unpaid", "pay_on_arrival", "refunded"].includes(paymentStatus)) patch.paymentStatus = paymentStatus;
  if (Object.keys(patch).length) await adminSetStatus(id, patch);
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

export async function createMemberAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const tier = String(formData.get("tier") ?? "") as TierKey;
  const billing = String(formData.get("billing") ?? "annual") === "lifetime" ? "lifetime" : "annual";
  if (!TIERS.includes(tier)) return { error: "Choose a tier." };
  const res = await createMember({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    tier,
    billing,
    guestPasses: Number(formData.get("guestPasses") ?? 0) || 0,
    notes: String(formData.get("notes") ?? ""),
    status: "active",
  });
  if (!res.ok) return { error: res.error };
  revalidatePath("/admin/members");
  redirect(`/admin/members/${res.value.member.id}?created=1`);
}

export async function updateMemberAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  const tier = String(formData.get("tier") ?? "");
  const status = String(formData.get("status") ?? "");
  const billing = String(formData.get("billing") ?? "");
  const renews = String(formData.get("renewsAt") ?? "");
  await updateMember(id, {
    firstName: String(formData.get("firstName") ?? "").trim() || undefined,
    lastName: String(formData.get("lastName") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || null,
    tier: TIERS.includes(tier as TierKey) ? tier : undefined,
    status: ["pending", "active", "suspended", "expired"].includes(status) ? status : undefined,
    billing: ["annual", "lifetime"].includes(billing) ? billing : undefined,
    renewsAt: billing === "lifetime" ? null : renews ? new Date(`${renews}T12:00:00Z`) : undefined,
    lockerNumber: String(formData.get("lockerNumber") ?? "").trim() || null,
    guestPassesRemaining: Math.max(0, Number(formData.get("guestPassesRemaining") ?? 0) || 0),
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  revalidatePath(`/admin/members/${id}`);
  revalidatePath("/admin/members");
  redirect(`/admin/members/${id}?saved=1`);
}

export async function regenerateActivationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await regenerateActivation(id);
  revalidatePath(`/admin/members/${id}`);
}

export async function updateRequestAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  const staffNotes = String(formData.get("staffNotes") ?? "").trim();
  if (!Number.isInteger(id) || id <= 0) return;
  const patch: { status?: string; staffNotes?: string | null } = {};
  if (["requested", "approved", "declined", "fulfilled", "cancelled"].includes(status)) patch.status = status;
  if (formData.has("staffNotes")) patch.staffNotes = staffNotes || null;
  await updateMemberRequest(id, patch);
  revalidatePath("/admin/requests");
  revalidatePath("/members");
}
