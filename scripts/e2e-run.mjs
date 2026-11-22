/**
 * Local E2E launcher — sets safe defaults and avoids the Windows "frozen" hang:
 * - Forces E2E_RUN=1
 * - Forces base URL onto 127.0.0.1 (never localhost/::1)
 * - Auto-reuses Next only when http://127.0.0.1:PORT answers quickly
 * - Otherwise starts a fresh webServer (no 3-minute wait on a dead listener)
 *
 * Usage:
 *   node scripts/e2e-run.mjs --project=smoke
 *   node scripts/e2e-run.mjs --project=chromium e2e/cart.spec.ts
 */
import http from "node:http";
import { spawn } from "node:child_process";

const port = process.env.E2E_PORT || "3005";
const forcedBase = `http://127.0.0.1:${port}`;

process.env.E2E_RUN = "1";
process.env.E2E_BASE_URL = (
  process.env.E2E_BASE_URL || forcedBase
).replace("://localhost", "://127.0.0.1");

if (!process.env.E2E_WORKERS) {
  process.env.E2E_WORKERS = "2";
}

function probe(url, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(typeof res.statusCode === "number" && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

const healthy = await probe(process.env.E2E_BASE_URL);

if (process.env.E2E_REUSE_SERVER === "0") {
  delete process.env.E2E_REUSE_SERVER;
} else if (healthy) {
  process.env.E2E_REUSE_SERVER = "1";
  console.log(`[e2e-run] Reusing healthy server at ${process.env.E2E_BASE_URL}`);
} else {
  delete process.env.E2E_REUSE_SERVER;
  console.log(
    `[e2e-run] No healthy server on ${process.env.E2E_BASE_URL} — Playwright will start Next`,
  );
}

const extraArgs = process.argv.slice(2);
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(
  npxBin,
  ["playwright", "test", "--reporter=line", ...extraArgs],
  {
    stdio: "inherit",
    env: process.env,
    shell: false,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
