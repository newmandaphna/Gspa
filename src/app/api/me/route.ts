import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/members/auth";
import { tierByKey } from "@/lib/content/membership";

export const dynamic = "force-dynamic";

/** Minimal session probe for the nav. Never returns email or member number. */
export async function GET() {
  const member = await getCurrentMember();
  return NextResponse.json(
    member ? { member: { firstName: member.firstName, tier: member.tier, tierName: tierByKey(member.tier)?.name ?? member.tier } } : { member: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
