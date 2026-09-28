import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { SITE } from "@/lib/config/site";

/** Header in landing-only mode: the mark home, and the list. Nothing else to navigate to. */
export function LandingHeader() {
  return (
    <header data-theme="dark" className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label={`${SITE.name} home`} className="text-snow">
          <Wordmark tone="current" className="text-[22px]" />
        </Link>
        <Link href="/#join" className="inline-flex h-9 items-center rounded-pill bg-snow px-5 text-[0.875rem] font-medium text-ink transition-colors hover:bg-white">
          Join the list
        </Link>
      </div>
    </header>
  );
}

/** Footer in landing-only mode. */
export function LandingFooter() {
  const year = new Date().getFullYear();
  const instagram = SITE.social.instagram;
  return (
    <footer data-theme="dark" className="bg-night text-mist">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-10 font-mono text-[0.8125rem] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {year} {SITE.name} · {SITE.area}
        </p>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={`mailto:${SITE.email}`} className="hover:text-snow">
            {SITE.email}
          </a>
          {instagram && (
            <a href={instagram} target="_blank" rel="noreferrer" className="hover:text-snow">
              Instagram
            </a>
          )}
          <Link href="/legal#privacy" className="hover:text-snow">
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  );
}

/** A quiet pill for a signed-in admin: the public sees only the landing page. */
export function PreviewPill() {
  return (
    <p className="pointer-events-none fixed bottom-20 left-4 z-[90] rounded-pill bg-accent px-3 py-1.5 font-mono text-[0.6875rem] text-ink shadow-lg md:bottom-4">
      Preview · the public sees the landing page only
    </p>
  );
}
