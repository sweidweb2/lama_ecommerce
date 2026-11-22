import { test } from "@playwright/test";
import { e2eStrict } from "./env";

/**
 * Skip (or fail in E2E_STRICT) when a fixture/cred is missing.
 * Call from inside a test or beforeEach.
 */
export function requireOrSkip(condition: boolean, reason: string): void {
  if (condition) return;
  if (e2eStrict) {
    throw new Error(`E2E_STRICT: ${reason}`);
  }
  test.skip(true, reason);
}
