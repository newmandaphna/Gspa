"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/config/site";

const QUERY = encodeURIComponent(`${SITE.address.line1}, ${SITE.address.city}, ${SITE.address.state} ${SITE.address.zip}`);
/** Keyless Google Maps embed. If the owner supplies a Maps key, swap this for a Static Maps still (dark style, gold pin). */
const EMBED_SRC = `https://www.google.com/maps?q=${QUERY}&z=15&output=embed`;

/**
 * A real map, loaded on tap. The poster is the hairline street grid with the
 * pin and the address, so nothing from Google runs until the visitor asks.
 * On dark bands the iframe is inverted and desaturated to sit with the page.
 */
export function MapEmbed({ tone = "light", className, poster }: { tone?: "light" | "dark"; className?: string; poster: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {loaded ? (
        <iframe
          src={EMBED_SRC}
          title={`Map: ${SITE.name}, ${SITE.address.line1}, ${SITE.address.neighborhood}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          style={tone === "dark" ? { filter: "invert(.92) hue-rotate(180deg) saturate(.6)" } : undefined}
        />
      ) : (
        <>
          <div className="absolute inset-0" aria-hidden="true">
            {poster}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className={cn(
                "inline-flex h-11 items-center rounded-pill px-6 text-[0.9375rem] font-medium shadow-[var(--shadow-card)] transition-colors",
                tone === "dark" ? "bg-snow text-ink hover:bg-white" : "bg-ink text-snow hover:bg-night-3",
              )}
            >
              Load map
            </button>
            <p className={cn("font-mono text-[0.75rem]", tone === "dark" ? "text-mist" : "text-ink-muted")}>Google Maps loads when you tap.</p>
          </div>
        </>
      )}
    </div>
  );
}
