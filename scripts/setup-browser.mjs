import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import { browserExecutable } from "./browser-runtime.mjs";

const executablePath = browserExecutable();
if (!executablePath) {
  const require = createRequire(import.meta.url);
  const result = spawnSync(process.execPath, [
    join(dirname(require.resolve("playwright/package.json")), "cli.js"),
    "install",
    "--with-deps",
    "chromium",
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.setContent("<title>Browser runtime ready</title>");
  if (await page.title() !== "Browser runtime ready") {
    throw new Error("Chromium smoke check failed");
  }
  console.log(`Chromium ${browser.version()} ready (${executablePath || "Playwright-managed"}); Node ${process.version}.`);
} finally {
  await browser.close();
}