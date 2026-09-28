import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontClassName } from "@/app/fonts";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MotionProvider } from "@/components/MotionProvider";
import { SITE } from "@/lib/config/site";
import { computeOpenStatus } from "@/lib/hours";
import { LandingFooter, LandingHeader, PreviewPill } from "@/components/landing/LandingChrome";
import { isAdmin } from "@/lib/auth";
import { getCurrentMember } from "@/lib/members/auth";
import { JsonLd } from "@/lib/seo/JsonLd";
import { localBusinessJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name}: Private Shooting Club, Queens, New York`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name}: Private Shooting Club, Queens, New York`,
    description: SITE.description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  robots: { index: true, follow: true },
  // Icons come from src/app/icon.svg, icon.png and apple-icon.png (Next.js wires the link tags).
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The session probe lives here rather than in a client fetch from the nav, so the
  // member's name is in the first HTML. A database hiccup must never take the chrome down.
  const member = await getCurrentMember().catch(() => null);
  const memberName = member?.firstName ?? null;
  const initialStatus = computeOpenStatus(new Date());
  // Landing-only mode: the public gets the bare landing chrome; a signed-in admin previews the full site.
  const admin = SITE.landingOnly ? await isAdmin().catch(() => false) : false;
  const landing = SITE.landingOnly && !admin;
  return (
    <html lang="en" className={fontClassName} suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-dvh flex flex-col bg-paper text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-snow"
        >
          Skip to content
        </a>
        <MotionProvider>
          {landing ? <LandingHeader /> : <Nav memberName={memberName} initialStatus={initialStatus} />}
          <main id="main" className="flex-1">
            {children}
          </main>
          {landing ? <LandingFooter /> : <Footer id="site-footer" />}
          {SITE.landingOnly && admin && <PreviewPill />}
        </MotionProvider>
        {/* LocalBusiness record for search engines, built from site.ts and the catalog (src/lib/seo/jsonld.ts). */}
        <JsonLd data={localBusinessJsonLd()} />
      </body>
    </html>
  );
}
