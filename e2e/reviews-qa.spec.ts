import { test, expect } from "@playwright/test";
import { e2eEnabled, e2eUser } from "./helpers/env";
import {
  expectLoggedInAsCustomer,
  loginViaUi,
  logoutIfPossible,
} from "./helpers/auth";
import { openFirstProduct } from "./helpers/catalog";
import {
  deleteProductQuestion,
  deleteProductQuestionsContaining,
  deleteReviewsForUserProduct,
  e2eDbReady,
  ensureE2eCustomer,
  getProductBySlug,
  seedApprovedQa,
} from "./helpers/db";

/**
 * Block 12 — Reviews & Q&A (storefront)
 */
test.describe("Block 12 — reviews & Q&A", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test("logged-in user can create one review and ask a question", async ({
    page,
  }) => {
    test.skip(!e2eDbReady(), "Needs Supabase service role for review cleanup");

    let email = e2eUser.email();
    let password = e2eUser.password();
    let userId: string | null = null;
    if (!email || !password) {
      const customer = await ensureE2eCustomer();
      email = customer.email;
      password = customer.password;
      userId = customer.userId;
    } else {
      const customer = await ensureE2eCustomer({ email, password });
      userId = customer.userId;
    }

    await logoutIfPossible(page);
    await loginViaUi(page, email, password);
    await expectLoggedInAsCustomer(page);

    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    const slug = page.url().split("/products/")[1]?.split(/[?#]/)[0];
    expect(slug).toBeTruthy();
    const product = await getProductBySlug(slug!);
    test.skip(!product, "Could not resolve product by slug");

    const marker = `e2e-qa-${Date.now()}`;
    await deleteReviewsForUserProduct(userId!, product!.id);
    await deleteProductQuestionsContaining(product!.id, "e2e-qa-");

    await page.reload();
    await expect(
      page.getByRole("heading", { name: /^reviews$/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /rate 5 stars/i }).click();
    await page.getByLabel(/your review/i).fill(`E2E review ${marker}`);
    await page.getByRole("button", { name: /submit review/i }).click();

    await expect(page.getByText(/review submitted/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText(/awaiting approval|already reviewed this product/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("button", { name: /submit review/i }),
    ).toHaveCount(0);

    await page.getByLabel(/your question/i).fill(`Does this fit? ${marker}`);
    await page.getByRole("button", { name: /submit question/i }).click();
    await expect(page.getByText(/question submitted/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // One-review guard still holds after refresh.
    await page.reload();
    await expect(
      page.getByText(/awaiting approval|already reviewed this product/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /submit review/i }),
    ).toHaveCount(0);

    // Pending question must not appear for guests.
    await logoutIfPossible(page);
    await page.goto(`/products/${slug}`);
    await expect(page.getByText(marker)).toHaveCount(0);
  });

  test("only approved Q&A is visible to guests", async ({ page }) => {
    test.skip(!e2eDbReady(), "Needs Supabase service role for Q&A seed");

    await logoutIfPossible(page);
    const opened = await openFirstProduct(page);
    test.skip(!opened, "No products in catalog — seed products first");

    const slug = page.url().split("/products/")[1]?.split(/[?#]/)[0];
    const product = await getProductBySlug(slug!);
    test.skip(!product, "Could not resolve product by slug");

    const stamp = Date.now();
    const approvedQ = `E2E approved question ${stamp}`;
    const approvedA = `E2E approved answer ${stamp}`;
    const pendingMarker = `e2e-pending-${stamp}`;

    const seeded = await seedApprovedQa({
      productId: product!.id,
      question: approvedQ,
      answer: approvedA,
    });

    try {
      const customer = e2eUser.ready()
        ? await ensureE2eCustomer({
            email: e2eUser.email()!,
            password: e2eUser.password()!,
          })
        : await ensureE2eCustomer();

      await loginViaUi(page, customer.email, customer.password);
      await expectLoggedInAsCustomer(page);
      await page.goto(`/products/${slug}`);
      await page
        .getByLabel(/your question/i)
        .fill(`Pending only ${pendingMarker}`);
      await page.getByRole("button", { name: /submit question/i }).click();
      await expect(page.getByText(/question submitted/i).first()).toBeVisible({
        timeout: 15_000,
      });
      await logoutIfPossible(page);

      await page.goto(`/products/${slug}`);
      await expect(page.getByText(approvedQ)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(approvedA)).toBeVisible();
      await expect(page.getByText(pendingMarker)).toHaveCount(0);
    } finally {
      await deleteProductQuestion(seeded.questionId);
      await deleteProductQuestionsContaining(product!.id, pendingMarker);
    }
  });
});
