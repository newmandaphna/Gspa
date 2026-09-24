"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TargetRings } from "@/components/art";
import { deskPhone, deskPhoneHref, SITE } from "@/lib/config/site";

// Until the owner sets the number, the desk is one tap away by email instead.
const PHONE = deskPhone();
const CONTACT_HREF = deskPhoneHref() ?? `mailto:${SITE.email}`;
const CONTACT_LABEL = PHONE ? `Call ${PHONE}` : "Email the desk";
const CONTACT_VERB = PHONE ? "call" : "write to";

/** Route error boundary. Same voice as the 404: short, and the desk is one tap away. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <Section theme="black" className="grain min-h-dvh overflow-hidden pt-[var(--nav-h)]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 opacity-60">
        <TargetRings tone="dark" />
      </div>
      <Container className="relative flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="t-eyebrow text-accent">Error</p>
        <h1 className="t-hero mt-4">Misfire.</h1>
        <p className="t-lead mt-4 max-w-[520px] text-mist">Something jammed on our side, not yours. Try once more, or {CONTACT_VERB} the desk and a person will sort it.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button href={CONTACT_HREF} variant="secondary">
            {CONTACT_LABEL}
          </Button>
        </div>
        {error.digest && <p className="t-footnote mt-8 font-mono text-mist/70">Reference {error.digest}</p>}
      </Container>
    </Section>
  );
}
