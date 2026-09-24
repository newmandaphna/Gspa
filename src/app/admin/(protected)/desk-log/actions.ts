"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { addDeskLogEntry, deleteDeskLogEntry } from "@/lib/desk-log";

export type DeskLogActionState = { error?: string; ok?: boolean };

export async function addDeskLogAction(_prev: DeskLogActionState, formData: FormData): Promise<DeskLogActionState> {
  await requireAdmin();
  const res = await addDeskLogEntry({
    date: String(formData.get("date") ?? ""),
    text: String(formData.get("text") ?? ""),
    initials: String(formData.get("initials") ?? ""),
  });
  if (!res.ok) return { error: res.error };
  revalidatePath("/");
  revalidatePath("/visit");
  revalidatePath("/admin/desk-log");
  redirect("/admin/desk-log?saved=1");
}

export async function deleteDeskLogAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await deleteDeskLogEntry(id);
  revalidatePath("/");
  revalidatePath("/visit");
  revalidatePath("/admin/desk-log");
}
