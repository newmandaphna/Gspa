import { cookies } from "next/headers";
import type { Member } from "@/lib/db/schema";
import { cookieSecure } from "@/lib/auth";
import { MEMBER_SESSION_TTL_SEC, passwordFingerprint, signMemberSession, verifyMemberSession } from "@/lib/members/crypto";
import { getMemberById } from "@/lib/members/service";

const COOKIE = "gs_member";

/** Issues a session bound to this member's current password. Re-call after a password change to keep this device signed in. */
export async function setMemberSessionCookie(member: Pick<Member, "id" | "passwordHash">): Promise<void> {
  (await cookies()).set(COOKIE, signMemberSession(member.id, member.passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
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
  const claims = verifyMemberSession(token);
  if (!claims) return null;
  const member = await getMemberById(claims.id);
  if (!member || member.status !== "active") return null;
  if (claims.fingerprint !== passwordFingerprint(member.passwordHash)) return null;
  return member;
}
