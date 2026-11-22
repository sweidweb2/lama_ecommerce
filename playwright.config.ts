import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/** Load `.env.local` into process.env when keys are unset (E2E_* creds, etc.). */
function loadEnvLocal(): void {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const e2eEnabled = process.env.E2E_RUN === "1";
/** Dedicated port so E2E never reuses some other app already on :3000. */
const e2ePort = process.env.E2E_PORT || "3005";
const baseURL =
  process.env.E2E_BASE_URL || `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: e2eEnabled ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(e2eEnabled
    ? {
        webServer: {
          command: `npx next dev --hostname 127.0.0.1 -p ${e2ePort}`,
          url: baseURL,
          // Only reuse when you explicitly opt in (same app already on E2E_PORT).
          reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
          timeout: 180_000,
        },
      }
    : {}),
});
