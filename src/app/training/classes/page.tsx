import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMeta } from "@/lib/seo/meta";
import { ClassSchedule } from "@/components/classes/ClassSchedule";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { CLASSES } from "@/lib/content/pages/training";

export const metadata: Metadata = pageMeta("/training/classes", {
  title: CLASSES.meta.title,
  description: CLASSES.meta.description,
});

/** Server shell while the client schedule mounts: the same head, headline and subhead, so nothing jumps. */
function Fallback() {
  return (
    <div className="max-w-[720px]">
      <Eyebrow className="mb-4">
        {CLASSES.head.seats} · {CLASSES.head.cadence}
      </Eyebrow>
      <h1 className="t-1 max-w-[14em]">{CLASSES.headline}</h1>
      <p className="t-subhead mt-3 max-w-[26em] text-muted">{CLASSES.subhead}</p>
      <p role="status" className="t-caption mt-12 text-ink-muted">
        {CLASSES.loading}
      </p>
    </div>
  );
}

export default function ClassesPage() {
  return (
    /* The first band is paper, like /reserve and /legal, and clears the fixed bar the same way they do. */
    <Section theme="light" padding="normal" className="pt-[calc(var(--nav-h)+3rem)] sm:pt-[calc(var(--nav-h)+4.5rem)]">
      <Container>
        <Suspense fallback={<Fallback />}>
          <ClassSchedule />
        </Suspense>
      </Container>
    </Section>
  );
}
