import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { SITE } from "@/lib/config/site";
import { landingRedirects } from "@/lib/landing";

/**
 * Landing-only mode (SITE.landingOnly): every public page except the sign-up
 * and privacy redirects to "/". A signed-in admin passes through and sees the
 * whole site. With the switch off this does nothing.
 */
export function proxy(request: NextRequest) {
  if (!SITE.landingOnly) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (!landingRedirects(pathname)) return NextResponse.next();
  if (verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return NextResponse.redirect(url, 307);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/).*)"],
};
