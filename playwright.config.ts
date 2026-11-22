import fs from "node:fs";
import os from "node:os";
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
/**
 * Bind/health-check on 127.0.0.1 (not localhost).
 * On Windows, localhost → ::1; a wedged IPv6-only Next makes Playwright's
 * webServer health check hang for up to 180s (looks frozen).
 */
const rawBase =
  process.env.E2E_BASE_URL || `http://127.0.0.1:${e2ePort}`;
const baseURL = rawBase.replace("://localhost", "://127.0.0.1");

const cpuCount = Math.max(1, os.cpus()?.length ?? 2);
const workersEnv = process.env.E2E_WORKERS?.trim();
const workers = e2eEnabled
  ? workersEnv
    ? Number(workersEnv)
    : Math.min(4, cpuCount)
  : undefined;

const useProdServer = process.env.E2E_WEB_SERVER === "prod";
const webServerCommand = useProdServer
  ? `npx next build && npx next start --hostname 127.0.0.1 -p ${e2ePort}`
  : `npx next dev --hostname 127.0.0.1 -p ${e2ePort}`;

const reuseExistingServer = process.env.E2E_REUSE_SERVER === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "list" : "line",
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "smoke",
      testMatch: "**/smoke.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: [/.*\.setup\.ts/, "**/smoke.spec.ts"],
      dependencies: e2eEnabled ? ["setup"] : [],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(e2eEnabled
    ? {
        webServer: {
          command: webServerCommand,
          url: baseURL,
          reuseExistingServer,
          // Fail faster when the port is wedged instead of sitting silent for 3 minutes.
          timeout: useProdServer ? 300_000 : reuseExistingServer ? 30_000 : 120_000,
        },
      }
    : {}),
});
