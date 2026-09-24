import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { LanePerspective } from "@/components/art";

// Temporary placeholder — replaced by the full home page.
export default function HomePage() {
  return (
    <Section theme="black" bleed className="grain min-h-dvh overflow-hidden pt-[var(--nav-h)]">
      <div className="absolute inset-0">
        <LanePerspective />
      </div>
      <Container className="relative flex min-h-[calc(100dvh-var(--nav-h))] flex-col items-center justify-center text-center">
        <h1 className="t-display">Precision, refined.</h1>
        <p className="t-lead mt-5 max-w-[640px] text-mist">A private shooting club in Jamaica, Queens.</p>
        <div className="mt-8">
          <Button href="/reserve" size="lg">
            Reserve a lane
          </Button>
        </div>
      </Container>
    </Section>
  );
}
