import localFont from "next/font/local";

/**
 * Self-hosted type, all OFL (licenses beside the files in src/assets/fonts).
 *
 *   Archivo (variable weight and width): only ever in capitals. Headlines at
 *   115 to 125 percent width, buttons, labels and running heads. A machined voice.
 *   Bodoni Moda italic: the "spa" half. Used sparingly, for subheads and the
 *   odd word that should feel like a hotel rather than a range.
 *   Big Shoulders Stencil: numerals only (lane numbers, windows, counts),
 *   the way a crate or a lane marker is painted.
 *   Libre Caslon Text: everything read as sentences. Body copy, card titles,
 *   notes, times and prices. The old English book face, the one the London
 *   gunmakers printed their catalogues in.
 *
 * Each family sets a CSS variable that globals.css maps onto --font-sans (Caslon),
 * --font-display, --font-serif (Bodoni), --font-stencil and --font-mono (Caslon;
 * there is no monospace on the site).
 */

export const archivo = localFont({
  src: [
    { path: "../assets/fonts/archivo-latin-standard-normal.woff2", weight: "100 900", style: "normal" },
    { path: "../assets/fonts/archivo-latin-standard-italic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-archivo",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
  preload: true,
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const bodoni = localFont({
  src: [
    { path: "../assets/fonts/bodoni-moda-latin-standard-italic.woff2", weight: "400 900", style: "italic" },
    { path: "../assets/fonts/bodoni-moda-latin-standard-normal.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--font-bodoni",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Didot", "Georgia", "serif"],
  preload: true,
});

export const stencil = localFont({
  src: [{ path: "../assets/fonts/big-shoulders-stencil-display-latin-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-stencil-face",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Impact", "Haettenschweiler", "Arial Narrow", "sans-serif"],
  preload: false,
});

export const caslon = localFont({
  src: [
    { path: "../assets/fonts/libre-caslon-text-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/libre-caslon-text-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../assets/fonts/libre-caslon-text-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-caslon",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "Times New Roman", "serif"],
  preload: true,
});

/** Class names to put on <html> so the variables resolve everywhere, including error boundaries. */
export const fontClassName = `${archivo.variable} ${bodoni.variable} ${stencil.variable} ${caslon.variable}`;
