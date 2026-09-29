"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { processSignupSheetQueue, syncSignup } from "@/lib/signup-sheet";

export async function retrySignupAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return;
  await syncSignup(id, true);
  revalidatePath("/admin/inquiries");
}

export async function retryDueSignupsAction(): Promise<void> {
  await requireAdmin();
  await processSignupSheetQueue();
  revalidatePath("/admin/inquiries");
}