import localFont from "next/font/local";

/**
 * Self-hosted type, all OFL (licenses beside the files in src/assets/fonts).
 *
 *   Archivo (variable weight and width): headlines at 115 to 125 percent width
 *   in heavy capitals, body copy at normal width, data labels condensed. One
 *   family across widths is the idea: a machined, industrial voice.
 *   Bodoni Moda italic: the "spa" half. Used sparingly, for subheads and the
 *   odd word that should feel like a hotel rather than a range.
 *   Big Shoulders Stencil: numerals only (lane numbers, windows, counts),
 *   the way a crate or a lane marker is painted.
 *   Martian Mono: running heads, times, codes.
 *
 * Each family sets a CSS variable that globals.css maps onto --font-sans,
 * --font-display, --font-serif, --font-stencil and --font-mono.
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

export const martian = localFont({
  src: [{ path: "../assets/fonts/martian-mono-latin-standard-normal.woff2", weight: "100 800", style: "normal" }],
  variable: "--font-martian",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
  preload: false,
  declarations: [{ prop: "font-stretch", value: "75% 112.5%" }],
});

/** Class names to put on <html> so the variables resolve everywhere, including error boundaries. */
export const fontClassName = `${archivo.variable} ${bodoni.variable} ${stencil.variable} ${martian.variable}`;
