import type { Metadata } from "next";
import Link from "next/link";
import { InterestForm } from "@/components/pages/membership/InterestForm";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Render } from "@/components/ui/Render";
import { Section } from "@/components/ui/Section";
import { MEMBERSHIP_PRELAUNCH as M } from "@/lib/content/pages/membership";
import { pageMeta } from "@/lib/seo/meta";

export const metadata: Metadata = pageMeta("/membership", { title: M.meta.title, description: M.meta.description });

/**
 * Membership before opening, as the owner's model defines it: for NYC pistol
 * licensees, with a list to join. The full tier page (MembershipFull) is kept
 * for when tiers, benefits and pricing are set.
 */
export default function MembershipPage() {
  return (
    <>
      <Section theme="black" bleed aria-labelledby="membership-title" className="relative flex min-h-[88svh] items-end overflow-hidden">
        <Render name="casings" priority className="opacity-60" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(10,10,11,0.96)_0%,rgba(10,10,11,0.7)_45%,rgba(10,10,11,0.2)_100%)]" />
        <Container className="relative pb-16 pt-[calc(var(--nav-h)+4rem)] sm:pb-24">
          <p className="t-eyebrow text-mist">{M.hero.eyebrow}</p>
          <h1 id="membership-title" className="t-hero mt-6 max-w-[14em] text-snow">
            {M.hero.headline}
          </h1>
          <p className="t-body-lg mt-8 max-w-[34em] text-mist">{M.hero.body}</p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Button href={M.hero.cta.href} variant="accent" size="lg">
              {M.hero.cta.label}
            </Button>
            <p className="t-caption text-mist">
              Already a member?{" "}
              <Link href="/members/login" className="underline underline-offset-4 hover:text-snow">
                Sign in
              </Link>
            </p>
          </div>
        </Container>
      </Section>

      <Section theme="light" aria-labelledby="expect-title">
        <Container>
          <Eyebrow className="mb-6">{M.expect.eyebrow}</Eyebrow>
          <h2 id="expect-title" className="t-1 max-w-[16em]">
            {M.expect.headline}
          </h2>
          <ol className="mt-12 grid border-t border-ink sm:grid-cols-3">
            {M.expect.rows.map((r, i) => (
              <li key={r.title} className="border-b border-hairline py-8 pr-6 sm:border-b-0 sm:pl-6 sm:first:pl-0 sm:[&+li]:border-l">
                <span className="t-stencil block text-[3rem] leading-none text-accent-deep">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="t-3 mt-4">{r.title}</h3>
                <p className="t-body mt-2 text-ink-muted">{r.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section theme="black" id="apply" aria-labelledby="apply-title" className="scroll-mt-[var(--nav-h)]">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <Eyebrow className="mb-6">{M.apply.eyebrow}</Eyebrow>
              <h2 id="apply-title" className="t-1 text-snow">
                {M.apply.headline}
              </h2>
              <p className="t-body-lg mt-6 max-w-[30em] text-mist">{M.apply.body}</p>
            </div>
            <div className="lg:col-span-7">
              <InterestForm />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
