import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import { expectToast, selectOption } from "./helpers/admin";
import {
  createUniqueE2eCustomer,
  deleteAuthUserByEmail,
  deleteProductQuestion,
  deleteReviewById,
  e2eDbReady,
  getFirstActiveInStockProduct,
  seedPendingQuestion,
  seedPendingReview,
} from "./helpers/db";
import { adminAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 19 — Admin reviews / Q&A moderation (thin)
 */
test.describe("Block 19 — admin moderation", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.use({ storageState: adminAuthFile });
  test.describe.configure({ timeout: 120_000 });

  test("approve pending review", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs service role");

    const product = await getFirstActiveInStockProduct();
    requireOrSkip(Boolean(product), "No in-stock product");
    const customer = await createUniqueE2eCustomer("e2e-mod-rev");
    const marker = `E2E pending review ${Date.now()}`;
    const review = await seedPendingReview({
      productId: product!.id,
      userId: customer.userId,
      comment: marker,
    });

    try {
      await page.goto("/admin/reviews");
      await expect(
        page.getByRole("heading", { name: /^reviews$/i }),
      ).toBeVisible();
      await expect(page.getByText(marker).first()).toBeVisible({
        timeout: 15_000,
      });

      await page
        .getByRole("button", { name: new RegExp(`Edit review ${review.id}`, "i") })
        .click();
      await expect(
        page.getByRole("heading", { name: /edit review/i }),
      ).toBeVisible();

      await selectOption(
        page,
        page.locator(`#review-status-${review.id}`),
        /^Approved$/i,
      );
      await page.getByRole("button", { name: /save changes/i }).click();
      await expectToast(page, /review updated/i);

      await page.goto(`/products/${product!.slug}`);
      await expect(page.getByText(marker).first()).toBeVisible({
        timeout: 20_000,
      });
    } finally {
      await deleteReviewById(review.id);
      await deleteAuthUserByEmail(customer.email).catch(() => undefined);
    }
  });

  test("answer pending question makes it public", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs service role");

    const product = await getFirstActiveInStockProduct();
    requireOrSkip(Boolean(product), "No in-stock product");
    const stamp = Date.now();
    const questionText = `E2E pending Q ${stamp}`;
    const answerText = `E2E answer ${stamp}`;
    const seeded = await seedPendingQuestion({
      productId: product!.id,
      question: questionText,
    });

    try {
      await page.goto("/admin/qa");
      await expect(
        page.getByRole("heading", { name: /^q&a$/i }),
      ).toBeVisible();
      await expect(page.getByText(questionText).first()).toBeVisible({
        timeout: 15_000,
      });

      await page
        .getByRole("button", {
          name: new RegExp(`Edit question ${seeded.id}`, "i"),
        })
        .click();
      await expect(
        page.getByRole("heading", { name: /edit question/i }),
      ).toBeVisible();
      await page.locator(`#qa-answer-${seeded.id}`).fill(answerText);
      await selectOption(
        page,
        page.locator(`#qa-approved-${seeded.id}`),
        /^Approved$/i,
      );
      await page.getByRole("button", { name: /save changes/i }).click();

      await page.goto(`/products/${product!.slug}`);
      await expect(page.getByText(questionText).first()).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByText(answerText).first()).toBeVisible();
    } finally {
      await deleteProductQuestion(seeded.id);
    }
  });
});
