import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { TargetRings } from "@/components/art";

export default function NotFound() {
  return (
    <Section theme="black" className="grain min-h-dvh overflow-hidden pt-[var(--nav-h)]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 opacity-60">
        <TargetRings tone="dark" />
      </div>
      <Container className="relative flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="t-eyebrow text-accent">404</p>
        <h1 className="t-hero mt-4">Off target.</h1>
        <p className="t-lead mt-4 max-w-[520px] text-mist">That page doesn&apos;t exist. Let&apos;s get you back on the line.</p>
        <div className="mt-8 flex gap-3">
          <Button href="/">Home</Button>
          <Button href="/reserve" variant="secondary">
            Reserve
          </Button>
        </div>
      </Container>
    </Section>
  );
}
