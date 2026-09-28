#!/usr/bin/env node
/**
 * Renders the site's brass product shots from the 3D studio (src/components/three)
 * and writes WebP files to public/renders. Run against a dev server:
 *
 *   npm run dev            # in one terminal
 *   node scripts/render-brass.mjs http://localhost:5000
 *
 * Uses the Chromium that scripts/browser-runtime.mjs resolves. Output is committed,
 * so production never needs WebGL to show a still.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { browserExecutable } from "./browser-runtime.mjs";

const base = (process.argv[2] || "http://localhost:5000").replace(/\/$/, "");
const out = path.resolve("public/renders");
mkdirSync(out, { recursive: true });

const SHOTS = [
  { name: "hero-round", path: "/lab/render/hero?t=1.2", w: 1920, h: 1080 },
  { name: "hero-round-portrait", path: "/lab/render/hero-portrait?t=1.2", w: 900, h: 1500 },
  { name: "casings", path: "/lab/render/casings", w: 1800, h: 1200 },
  { name: "round-side", path: "/lab/render/round-side", w: 1800, h: 1100 },
  { name: "headstamp", path: "/lab/render/headstamp", w: 1400, h: 1400 },
  { name: "pair", path: "/lab/render/pair", w: 1600, h: 1200 },
  { name: "lineup", path: "/lab/render/lineup", w: 2000, h: 1100 },
  { name: "trio", path: "/lab/render/trio", w: 1000, h: 1250 },
  { name: "duo", path: "/lab/render/duo", w: 1500, h: 1000 },
  { name: "rest", path: "/lab/render/rest", w: 1600, h: 1200 },
  { name: "casing", path: "/lab/render/casing?bg=none", w: 400, h: 400, alpha: true },
];

const only = process.argv.slice(3);
const browser = await chromium.launch({ executablePath: browserExecutable(), args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const s of SHOTS.filter((s) => !only.length || only.includes(s.name))) {
  const page = await browser.newPage({ viewport: { width: s.w / 2, height: s.h / 2 }, deviceScaleFactor: 2 });
  await page.goto(base + s.path, { waitUntil: "networkidle" });
  // Keep the Next.js development badge out of the frame when rendering against `npm run dev`.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForFunction(() => window.__brassReady === true, null, { timeout: 120_000 });
  await page.waitForTimeout(300);
  const png = await page.screenshot({ type: "png", omitBackground: Boolean(s.alpha) });
  const img = sharp(png);
  await (s.alpha ? img.trim() : img).webp({ quality: 86, alphaQuality: 90 }).toFile(path.join(out, `${s.name}.webp`));
  console.log("rendered", s.name);
  await page.close();
}
await browser.close();
