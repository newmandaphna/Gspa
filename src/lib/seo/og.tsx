import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { CAP_HEIGHT, GUN, SPA } from "@/components/wordmark-paths";
import { FACILITY, SITE } from "@/lib/config/site";
import { mediaFor } from "@/lib/media/manifest";

/**
 * The share card, one builder for every opengraph-image.tsx route.
 *
 * Type is the site's own: Instrument Serif for the headline, IBM Plex Mono
 * for the fact line, read from the WOFF files beside this module (Satori,
 * which draws the card, reads TTF, OTF and WOFF, not WOFF2, so these are the
 * WOFF builds of the same @fontsource releases that next/font serves). The
 * wordmark is the outlined path data from wordmark-paths.ts, so no brand
 * font is needed at all.
 *
 * When the shoot lands, the page's hero photo (looked up in the media
 * manifest by slot id) sits under the gradient at 30 percent.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const GOLD = "#c9a55a";
const SNOW = "#f5f5f7";
const MIST = "#a1a1a6";

const FONT_DIR = path.join(process.cwd(), "src/lib/seo/fonts");

type OgFont = { name: string; data: ArrayBuffer; weight: 400; style: "normal" | "italic" };

let fontsPromise: Promise<OgFont[]> | null = null;

async function readFont(file: string): Promise<ArrayBuffer> {
  const buf = await readFile(path.join(FONT_DIR, file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** The three faces, read once per server process. */
export function loadOgFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all([
    readFont("instrument-serif-latin-400-normal.woff").then((data) => ({ name: "Instrument Serif", data, weight: 400 as const, style: "normal" as const })),
    readFont("instrument-serif-latin-400-italic.woff").then((data) => ({ name: "Instrument Serif", data, weight: 400 as const, style: "italic" as const })),
    readFont("ibm-plex-mono-latin-400-normal.woff").then((data) => ({ name: "IBM Plex Mono", data, weight: 400 as const, style: "normal" as const })),
  ]);
  return fontsPromise;
}

/** The hero photo for a slot as a data URI, or null until the shoot lands. */
async function heroPhoto(slot: string | undefined): Promise<string | null> {
  if (!slot) return null;
  const entry = mediaFor(slot);
  if (!entry) return null;
  try {
    const file = path.join(process.cwd(), "public", entry.src.replace(/^\//, ""));
    const buf = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** The lockup in the card's own gold and snow, sized by height. */
function WordmarkArt({ height }: { height: number }) {
  const scale = 0.9;
  const cartridgeH = 1250;
  const cartridgeW = (cartridgeH * 24) / 64;
  const gap = 320;
  const gunW = GUN.width * scale;
  const spaW = SPA.width * scale;
  const capTop = (cartridgeH - CAP_HEIGHT * scale) / 2;
  const cartridgeX = gunW + gap;
  const spaX = cartridgeX + cartridgeW + gap;
  const lockupW = spaX + spaW;
  const width = (height * lockupW) / cartridgeH;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${lockupW} ${cartridgeH}`}>
      <g transform={`translate(0 ${capTop}) scale(${scale})`}>
        <path d={GUN.d} fill={SNOW} />
      </g>
      <g transform={`translate(${cartridgeX} 0) scale(${cartridgeH / 64})`}>
        <path d="M12 2c3.2 4.6 5 9.8 5 15.5V22H7v-4.5C7 11.8 8.8 6.6 12 2z" fill={GOLD} />
        <path d="M7 22h10v30H7z" fill="none" stroke={SNOW} strokeWidth="2.2" />
        <path d="M6 52h12M6 56h12" stroke={SNOW} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7 58h10v3H7z" fill={SNOW} />
      </g>
      <g transform={`translate(${spaX} ${capTop}) scale(${scale})`}>
        <path d={SPA.d} fill={GOLD} />
      </g>
    </svg>
  );
}

export type OgCardOptions = {
  /** The page's headline, set in Instrument Serif. A segment wrapped in *asterisks* is set in gold italic. */
  headline: string;
  /** One mono line of fact under the headline. */
  fact: string;
  /** The page's hero photo slot, drawn at 30 percent once the manifest has it. */
  slot?: string;
  /** Mono running head at the top right, next to the wordmark. Defaults to the address. */
  head?: string;
};

/** The headline with one *gold italic* span allowed. */
function Headline({ text, size }: { text: string; size: number }) {
  const parts = text.split(/\*([^*]+)\*/);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        fontFamily: "Instrument Serif",
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: "-0.01em",
        color: SNOW,
        maxWidth: 1040,
      }}
    >
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{ color: GOLD, fontStyle: "italic", whiteSpace: "pre" }}>
            {part}
          </span>
        ) : (
          <span key={i} style={{ whiteSpace: "pre-wrap" }}>
            {part}
          </span>
        ),
      )}
    </div>
  );
}

/** Build the card. Each route's default export returns this. */
export async function ogCard(options: OgCardOptions): Promise<ImageResponse> {
  const [fonts, photo] = await Promise.all([loadOgFonts(), heroPhoto(options.slot)]);
  const head = options.head ?? `${SITE.address.line1} · ${SITE.address.neighborhood}`;
  const size = options.headline.length > 34 ? 84 : 104;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          background: "linear-gradient(180deg, #000 0%, #141416 100%)",
          color: SNOW,
          padding: "56px 64px 60px",
        }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            style={{ position: "absolute", top: 0, left: 0, width: OG_SIZE.width, height: OG_SIZE.height, objectFit: "cover", opacity: 0.3 }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: OG_SIZE.width,
            height: OG_SIZE.height,
            background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        {/* Lane hairlines: two faint rails, the same device as the icon, kept quiet. */}
        <div style={{ position: "absolute", left: 64, right: 64, top: 128, height: 1, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          <WordmarkArt height={44} />
          <div style={{ fontFamily: "IBM Plex Mono", fontSize: 20, letterSpacing: "0.12em", textTransform: "uppercase", color: MIST }}>{head}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <Headline text={options.headline} size={size} />
          <div style={{ width: 96, height: 4, background: GOLD, marginTop: 30 }} />
          <div style={{ fontFamily: "IBM Plex Mono", fontSize: 22, letterSpacing: "0.02em", color: MIST, marginTop: 22, maxWidth: 1040 }}>{options.fact}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

/** The fact line most cards share: lanes, yards, the drive from JFK. */
export const OG_FACT_LINE = `${FACILITY.laneCount} lanes at ${FACILITY.laneYards} yards · ${FACILITY.suites} private suites · ${FACILITY.transit.driveFromJfkMin} minutes from the JFK terminals`;
