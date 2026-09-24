import { cookies } from "next/headers";
import type { Member } from "@/lib/db/schema";
import { SITE } from "@/lib/config/site";
import { MEMBER_SESSION_TTL_SEC, signMemberSession, verifyMemberSession } from "@/lib/members/crypto";
import { getMemberById } from "@/lib/members/service";

const COOKIE = "gs_member";

export async function setMemberSessionCookie(memberId: number): Promise<void> {
  (await cookies()).set(COOKIE, signMemberSession(memberId), {
    httpOnly: true,
    sameSite: "lax",
    secure: SITE.url.startsWith("https://"),
    path: "/",
    maxAge: MEMBER_SESSION_TTL_SEC,
  });
}

export async function clearMemberSessionCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** The signed-in, active member for this request, or null. Safe to call from pages, actions and route handlers. */
export async function getCurrentMember(): Promise<Member | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const id = verifyMemberSession(token);
  if (!id) return null;
  const member = await getMemberById(id);
  if (!member || member.status !== "active") return null;
  return member;
}
