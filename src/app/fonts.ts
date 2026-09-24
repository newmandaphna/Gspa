import localFont from "next/font/local";

/**
 * Self-hosted type. The woff2 files in src/assets/fonts come from the
 * @fontsource packages (OFL, licenses alongside them) and are served from
 * this origin with immutable cache headers by next/font, so there are no
 * cross-origin hops before the first headline paints. Each family exposes a
 * CSS variable that globals.css maps onto --font-display, --font-sans and
 * --font-mono.
 *
 * The wordmark is outlined path data (see scripts/outline-wordmark.mjs),
 * so Montserrat is not loaded at all.
 */

export const instrumentSerif = localFont({
  src: [
    { path: "../assets/fonts/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Iowan Old Style", "Palatino Linotype", "Georgia", "Times New Roman", "serif"],
  preload: true,
});

export const instrumentSans = localFont({
  src: [
    { path: "../assets/fonts/instrument-sans-latin-wght-normal.woff2", weight: "400 700", style: "normal" },
    { path: "../assets/fonts/instrument-sans-latin-wght-italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-instrument-sans",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
  preload: true,
});

export const plexMono = localFont({
  src: [
    { path: "../assets/fonts/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
  preload: false,
});

/** Class names to put on <html> so the variables resolve everywhere, including error boundaries. */
export const fontClassName = `${instrumentSerif.variable} ${instrumentSans.variable} ${plexMono.variable}`;
