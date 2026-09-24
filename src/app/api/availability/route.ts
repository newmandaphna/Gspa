import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/booking";
import { getCurrentMember } from "@/lib/members/auth";
import { toContext } from "@/lib/members/service";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { isIsoDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Generous for a guest clicking through the calendar; slows down anyone walking member numbers.
  if (!rateLimit(`avail:${clientKey(req)}`, { limit: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }
  const url = new URL(req.url);
  const slug = url.searchParams.get("experience") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const memberNumber = url.searchParams.get("memberNumber");
  if (!slug || !isIsoDate(date)) {
    return NextResponse.json({ error: "experience and date (YYYY-MM-DD) are required" }, { status: 400 });
  }
  try {
    const current = await getCurrentMember();
    const availability = await getAvailability(slug, date, { member: current ? toContext(current) : null, memberNumber });
    if (!availability) return NextResponse.json({ error: "Unknown experience" }, { status: 404 });
    return NextResponse.json(availability, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[availability]", err);
    return NextResponse.json({ error: "Could not load availability" }, { status: 500 });
  }
}
