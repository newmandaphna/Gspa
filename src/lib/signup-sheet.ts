import { ReplitConnectors } from "@replit/connectors-sdk";
import type { Inquiry } from "@/lib/db/schema";

const spreadsheetId = "1gBSvnilQAc2jJ9h5uYwgVxYSpfVzd5QYi8jl5a749wg";
export const signupHeaders = ["Signup ID", "Signed up (UTC)", "Full name", "Email", "Phone", "ZIP code", "NYC pistol license", "Heard via"];

export function signupRow(inquiry: Inquiry): string[] {
  const field = (name: string) => inquiry.message.split("\n").find(line => line.startsWith(`${name}: `))?.slice(name.length + 2) ?? "";
  return [String(inquiry.id), inquiry.createdAt.toISOString(), inquiry.name, inquiry.email,
    inquiry.phone ?? "", field("ZIP"), field("NYC pistol license"), field("Heard via")];
}

/** The database save must succeed first. RAW prevents user text becoming formulas. */
export async function sendSignupToSheet(inquiry: Inquiry): Promise<void> {
  if (inquiry.kind !== "membership" || !inquiry.message.startsWith("Membership list (pre-opening)")) return;
  const connectors = new ReplitConnectors();
  const range = encodeURIComponent("'Sheet1'!A:H");
  const response = await connectors.proxy("google-sheet",
    `/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
      method: "POST",
      body: JSON.stringify({ values: [signupRow(inquiry)] }),
      headers: { "Content-Type": "application/json" },
    });
  if (!response.ok) throw new Error(`Google Sheets write failed (${response.status})`);
}