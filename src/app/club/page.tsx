import type { Metadata } from "next";
import { ClubPage } from "@/components/pages/club/ClubPage";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Render } from "@/components/ui/Render";
import { Section } from "@/components/ui/Section";
import { SITE } from "@/lib/config/site";
import { CLUB_META } from "@/lib/content/pages/club";
import { pageMeta } from "@/lib/seo/meta";

export const metadata: Metadata = SITE.clubPageLive
  ? pageMeta("/club", { title: CLUB_META.title, description: CLUB_META.description })
  : { ...pageMeta("/club", { title: "The Club", description: `${SITE.name}. The club page is coming soon.` }), robots: { index: false, follow: true } };

export default function Page() {
  if (SITE.clubPageLive) return <ClubPage />;
  return (
    <Section theme="black" bleed aria-labelledby="club-soon-title" className="relative flex min-h-[100svh] items-end overflow-hidden">
      <Render name="pair" priority className="opacity-70" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(10,10,11,0.95)_0%,rgba(10,10,11,0.55)_45%,rgba(10,10,11,0.1)_100%)]" />
      <Container className="relative pb-16 pt-[calc(var(--nav-h)+4rem)] sm:pb-24">
        <p className="t-eyebrow text-mist">The Club</p>
        <h1 id="club-soon-title" className="mt-6 text-snow">
          <span className="t-display block">Coming</span>
          <span className="t-accent -mt-[0.08em] block pl-[0.04em] text-[clamp(4rem,10vw,9rem)] leading-[0.8]">soon.</span>
        </h1>
        <p className="t-body-lg mt-8 max-w-[32em] text-mist">We are finishing the rooms. The full tour goes up here when they are ready.</p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Button href="/membership" variant="accent" size="lg">
            Membership
          </Button>
          <a href={`mailto:${SITE.email}`} className="link-arrow text-snow">
            {SITE.email}
          </a>
        </div>
      </Container>
    </Section>
  );
}
