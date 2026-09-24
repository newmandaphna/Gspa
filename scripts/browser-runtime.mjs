import { existsSync, accessSync, constants } from "node:fs";
import { delimiter, join } from "node:path";

// Nix's wrapper supplies Chromium's own dependency closure. Never change
// LD_LIBRARY_PATH for the Node test runner or the Next.js server.
export function browserExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    accessSync(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, constants.X_OK);
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  if (!existsSync("/nix/store")) return undefined;
  for (const directory of (process.env.PATH || "").split(delimiter)) {
    const candidate = join(directory, "chromium");
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Continue through PATH, not arbitrary bundled application libraries.
    }
  }
  throw new Error("Nix Chromium is missing. Install the chromium package declared in .replit, then run npm run e2e:setup.");
}