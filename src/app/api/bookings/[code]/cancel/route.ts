import { NextResponse } from "next/server";
import { cancelBooking } from "@/lib/booking";
import { sendBookingCancellation } from "@/lib/email";
import { expectedJson, isJsonRequest } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  if (!rateLimit(`cancel:${clientKey(req)}`, { limit: 10, windowMs: 10 * 60_000 })) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }
  const { code } = await ctx.params;
  if (!isJsonRequest(req)) return expectedJson();
  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = String(body.email ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const result = await cancelBooking(code, { email });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  // The guest asked, so the guest hears back. cancelBooking hands back the row
  // and its experience, so there is no second read to fail, and sendEmail
  // never throws. Never blocks the response.
  void sendBookingCancellation(result.booking, result.experience, "guest");
  return NextResponse.json({ ok: true, code: result.booking.code, status: result.booking.status });
}
