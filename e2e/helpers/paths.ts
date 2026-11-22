import fs from "node:fs";
import path from "node:path";

/** Auth storageState files written by `e2e/auth.setup.ts`. */
export const authDir = path.join(process.cwd(), "playwright", ".auth");
export const adminAuthFile = path.join(authDir, "admin.json");
export const customerAuthFile = path.join(authDir, "customer.json");

const emptyState = JSON.stringify({ cookies: [], origins: [] });

/** Ensure placeholder files exist so `test.use({ storageState })` never hits ENOENT. */
function ensureAuthPlaceholders(): void {
  fs.mkdirSync(authDir, { recursive: true });
  for (const file of [adminAuthFile, customerAuthFile]) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, emptyState);
    }
  }
}

ensureAuthPlaceholders();
