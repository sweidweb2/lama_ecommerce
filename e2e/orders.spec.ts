import { test, expect } from "@playwright/test";
import { GUEST_SESSION_COOKIE } from "@/lib/auth/guest-session.constants";
import { e2eEnabled } from "./helpers/env";
import { logoutIfPossible } from "./helpers/auth";
import {
  deleteOrderById,
  e2eDbReady,
  seedPendingOrder,
} from "./helpers/db";
import {
  orderDetailsPath,
  orderDetailsPathWithToken,
  orderShortCode,
} from "./helpers/orders";
import { customerAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 9 — Orders (storefront ACL)
 */
test.describe("Block 9 — storefront orders", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");

  test.describe("guest ACL", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ page }) => {
      await logoutIfPossible(page);
    });

    test("signed token opens order details", async ({ page }) => {
      requireOrSkip(e2eDbReady(), "Needs Supabase service role for order seed");
      const order = await seedPendingOrder();
      try {
        await page.goto(orderDetailsPathWithToken(order.id));
        await expect(
          page.getByRole("heading", { name: /order details/i }),
        ).toBeVisible({ timeout: 15_000 });
      } finally {
        await deleteOrderById(order.id);
      }
    });

    test("encrypted id without token or cookie is denied", async ({ page }) => {
      requireOrSkip(e2eDbReady(), "Needs Supabase service role for order seed");
      const order = await seedPendingOrder();
      try {
        await page.goto(orderDetailsPath(order.id));
        await expect(
          page.getByText(/error 404|page not found/i).first(),
        ).toBeVisible({ timeout: 15_000 });
      } finally {
        await deleteOrderById(order.id);
      }
    });

    test("guest cookie lists order on /orders", async ({ page, context }) => {
      requireOrSkip(e2eDbReady(), "Needs Supabase service role for order seed");
      const order = await seedPendingOrder();
      try {
        const baseURL = test.info().project.use.baseURL || "http://127.0.0.1:3005";
        await context.addCookies([
          {
            name: GUEST_SESSION_COOKIE,
            value: order.sessionId,
            url: baseURL,
          },
        ]);
        await page.goto("/orders");
        await expect(
          page.getByRole("heading", { name: /my orders/i }),
        ).toBeVisible();
        const short = orderShortCode(order.id);
        await expect(page.getByText(new RegExp(short, "i")).first()).toBeVisible({
          timeout: 15_000,
        });
      } finally {
        await deleteOrderById(order.id);
      }
    });

    test("find-order shows check-your-email success", async ({ page }) => {
      requireOrSkip(e2eDbReady(), "Needs Supabase service role for order seed");
      const order = await seedPendingOrder({
        email: `e2e-find-${Date.now()}@example.com`,
      });
      try {
        await page.goto("/orders/find");
        await expect(
          page.getByRole("heading", { name: /find your order/i }),
        ).toBeVisible({ timeout: 15_000 });
        await page.getByLabel(/email address/i).fill(order.email);
        await page.getByLabel(/order code/i).fill(orderShortCode(order.id));
        await page.getByRole("button", { name: /email me a link/i }).click();
        // Anti-enumeration success UI or toast — email send may be slow/mocked locally.
        await expect(
          page
            .getByRole("heading", { name: /check your email/i })
            .or(page.getByText(/check your email/i).first()),
        ).toBeVisible({ timeout: 20_000 });
      } finally {
        await deleteOrderById(order.id);
      }
    });
  });


  test.describe("customer", () => {
    test.use({ storageState: customerAuthFile });

    test("logged-in orders page loads", async ({ page }) => {
      await page.goto("/orders");
      await expect(
        page.getByRole("heading", { name: /my orders/i }),
      ).toBeVisible({ timeout: 15_000 });
    });
  });
});
