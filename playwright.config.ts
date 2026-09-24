import { defineConfig } from "@playwright/test";
import { browserExecutable } from "./scripts/browser-runtime.mjs";

const PORT = process.env.PORT || "5000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || `http://localhost:${PORT}`,
    headless: true,
    launchOptions: { executablePath: browserExecutable() },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: `http://localhost:${PORT}`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
