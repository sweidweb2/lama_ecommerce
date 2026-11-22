import { test, expect } from "@playwright/test";
import { e2eEnabled } from "./helpers/env";
import {
  createSubscribedLead,
  deleteLeadById,
  e2eDbReady,
} from "./helpers/db";

/**
 * Block 11 — Contact & newsletter leads
 */
test.describe("Block 11 — contact & leads", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test("submit contact form shows success toast", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/contact-us");
    await expect(page.locator("#full_name")).toBeVisible({ timeout: 20_000 });
    await page.locator("#full_name").fill("E2E Contact");
    await page.locator("#email").fill(`e2e-contact-${stamp}@example.com`);
    await page.locator("#subject").fill("E2E subject");
    await page.locator("#message").fill("Hello from Playwright E2E.");
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(
      page.getByText(/thank you for your message/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("honeypot-filled contact still shows success", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/contact-us");
    await expect(page.locator("#full_name")).toBeVisible({ timeout: 20_000 });
    await page.locator("#full_name").fill("E2E Bot");
    await page.locator("#email").fill(`e2e-honeypot-${stamp}@example.com`);
    await page.locator("#subject").fill("Bot subject");
    await page.locator("#message").fill("Should not be stored.");
    // Set honeypot via DOM so React controlled state picks it up without focus games.
    await page.locator("#website").evaluate((el) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, "https://spam.example");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(
      page.getByText(/thank you for your message/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("footer join-list shows success toast", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/");
    await page.getByRole("heading", { name: /join our list/i }).scrollIntoViewIfNeeded();
    await page
      .getByLabel(/email for updates/i)
      .fill(`e2e-lead-${stamp}@example.com`);
    await page.getByRole("button", { name: /^subscribe$/i }).click();

    await expect(
      page
        .getByText(/thanks! you're on our list|you're already on our list/i)
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("unsubscribe with valid token confirms", async ({ page }) => {
    test.skip(!e2eDbReady(), "Needs Supabase service role for lead seed");
    const stamp = Date.now();
    const lead = await createSubscribedLead(`e2e-unsub-${stamp}@example.com`);
    try {
      await page.goto(`/unsubscribe?token=${lead.token}`);
      await expect(
        page.getByText(/confirm that you want to leave/i),
      ).toBeVisible();
      await page.getByRole("button", { name: /confirm unsubscribe/i }).click();
      await expect(
        page.getByText(/you have been unsubscribed from our list/i),
      ).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteLeadById(lead.id);
    }
  });

  test("unsubscribe invalid token shows error", async ({ page }) => {
    await page.goto("/unsubscribe");
    await expect(
      page.getByText(/missing unsubscribe link/i),
    ).toBeVisible();

    await page.goto("/unsubscribe?token=not-a-uuid");
    await page.getByRole("button", { name: /confirm unsubscribe/i }).click();
    await expect(
      page.getByText(/this unsubscribe link is invalid/i),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto(
      "/unsubscribe?token=a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    );
    await page.getByRole("button", { name: /confirm unsubscribe/i }).click();
    await expect(
      page.getByText(/invalid or has expired/i),
    ).toBeVisible({ timeout: 15_000 });
  });
});
