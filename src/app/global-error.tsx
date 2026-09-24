"use client";

import "./globals.css";
import { fontClassName } from "@/app/fonts";
import { deskPhone, deskPhoneHref, SITE } from "@/lib/config/site";

// Until the owner sets the number, the desk is one tap away by email instead.
const PHONE = deskPhone();
const CONTACT_HREF = deskPhoneHref() ?? `mailto:${SITE.email}`;
const CONTACT_LABEL = PHONE ? `Call ${PHONE}` : "Email the desk";
const CONTACT_VERB = PHONE ? "call" : "write to";

/**
 * Last-resort boundary: replaces the root layout when it fails, so it brings
 * its own <html>, stylesheet and fonts. Plain markup on purpose; nothing here
 * depends on the components that may have thrown.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className={fontClassName}>
      <body data-theme="dark" className="min-h-dvh bg-night text-snow antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-20 text-center">
          <p className="t-eyebrow text-accent">Error</p>
          <h1 className="t-hero mt-4">Misfire.</h1>
          <p className="t-lead mt-4 max-w-[520px] text-mist">Something jammed on our side, not yours. Try once more, or {CONTACT_VERB} the desk and a person will sort it.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center justify-center rounded-pill bg-snow px-[22px] text-[1.0625rem] font-medium text-ink hover:bg-white"
            >
              Try again
            </button>
            <a
              href={CONTACT_HREF}
              className="inline-flex h-11 items-center justify-center rounded-pill px-[22px] text-[1.0625rem] font-medium text-snow ring-1 ring-inset ring-white/30 hover:bg-white/10"
            >
              {CONTACT_LABEL}
            </a>
          </div>
          {error.digest && <p className="t-footnote mt-8 font-mono text-mist/70">Reference {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
