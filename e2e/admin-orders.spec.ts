import { test, expect } from "@playwright/test";
import { e2eAdmin, e2eEnabled } from "./helpers/env";
import { adminOrderPath, expectToast } from "./helpers/admin";
import {
  deleteOrderById,
  e2eDbReady,
  seedPendingOrder,
  seedShipment,
  setOrderStatus,
} from "./helpers/db";
import { adminAuthFile } from "./helpers/paths";
import { requireOrSkip } from "./helpers/skip";

/**
 * Block 16 — Admin orders & shipments
 */
test.describe("Block 16 — admin orders & shipments", () => {
  test.skip(!e2eEnabled, "Set E2E_RUN=1 to run Playwright E2E");
  test.describe.configure({ timeout: 120_000 });
  test.use({ storageState: adminAuthFile });

  test("orders list filters by status", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs Supabase service role for order seed");

    const order = await seedPendingOrder();
    try {
      await page.goto("/admin/orders");
      await expect(page.getByRole("heading", { name: /^orders$/i })).toBeVisible();

      await page.getByRole("combobox").first().click();
      await page.getByRole("option", { name: "Pending", exact: true }).click();
      await expect(page).toHaveURL(/status=pending/);

      await expect(
        page.getByLabel(new RegExp(`View order ${order.id}`, "i")).first(),
      ).toBeVisible({ timeout: 15_000 });

      await page.getByRole("button", { name: /clear filters/i }).click();
      await expect(page).not.toHaveURL(/status=pending/);
    } finally {
      await deleteOrderById(order.id);
    }
  });

  test("status stepper: pending → processing; skip/reverse disabled", async ({
    page,
  }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs Supabase service role for order seed");

    const order = await seedPendingOrder();
    try {
      await page.goto(adminOrderPath(order.id));
      await expect(
        page.getByRole("heading", { name: /order details/i }),
      ).toBeVisible();

      const delivered = page.getByRole("button", {
        name: /set order status to delivered/i,
      });
      await expect(delivered).toBeDisabled();
      await expect(delivered).toHaveAttribute(
        "title",
        /cannot change from pending to delivered/i,
      );

      await page
        .getByRole("button", { name: /set order status to processing/i })
        .click();
      await expect(
        page.getByRole("heading", { name: /confirm status change/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /^confirm$/i }).click();
      await expectToast(page, /status updated/i);
      await expectToast(page, /order status changed to "processing"/i);

      await expect(
        page.getByRole("button", {
          name: /set order status to processing/i,
        }),
      ).toBeDisabled();
      await expect(
        page.getByRole("button", { name: /set order status to pending/i }),
      ).toBeDisabled();
    } finally {
      await deleteOrderById(order.id);
    }
  });

  test("ship requires carrier + tracking; edit shipment works", async ({
    page,
  }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs Supabase service role for order seed");

    const order = await seedPendingOrder();
    try {
      await setOrderStatus(order.id, "packed");
      await page.goto(adminOrderPath(order.id));

      await page
        .getByRole("button", { name: /set order status to shipped/i })
        .click();
      await expect(
        page.getByText(/enter carrier and tracking/i),
      ).toBeVisible();

      const confirm = page.getByRole("button", { name: /^confirm$/i });
      await expect(confirm).toBeDisabled();

      await page.locator("#shipment-carrier").fill("DHL E2E");
      await page.locator("#shipment-tracking").fill("TRACK-E2E-001");
      await confirm.click();
      await expectToast(page, /status updated/i);
      await expectToast(page, /order status changed to "shipped"/i);

      await page.getByRole("button", { name: /edit shipment/i }).click();
      await expect(
        page.getByRole("heading", { name: /edit shipment/i }),
      ).toBeVisible();
      await page.locator(`input[id^="carrier-"]`).fill("FedEx E2E");
      await page.locator(`input[id^="tracking-"]`).fill("TRACK-E2E-002");
      await page.getByRole("button", { name: /^save$/i }).click();
      await expectToast(page, /shipment updated/i);
      await expect(page.getByText(/FedEx E2E/i).first()).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteOrderById(order.id);
    }
  });

  test("delete pending order succeeds (restock path)", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs Supabase service role for order seed");

    const order = await seedPendingOrder();
    try {
      await page.goto(adminOrderPath(order.id));

      await page
        .getByRole("button", { name: new RegExp(`Delete order ${order.id}`, "i") })
        .click();
      await expect(
        page.getByRole("heading", { name: /delete order/i }),
      ).toBeVisible();
      await page.getByRole("button", { name: /^delete order$/i }).click();
      await expectToast(page, /order deleted successfully/i);
      await expect(page).toHaveURL(/\/admin\/orders\/?$/);
    } catch (err) {
      await deleteOrderById(order.id);
      throw err;
    }
  });

  test("refuse delete delivered order", async ({ page }) => {
    requireOrSkip(e2eAdmin.ready(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    requireOrSkip(e2eDbReady(), "Needs Supabase service role for order seed");

    // shipped → cancelled is allowed; only delivered (and returned) refuse delete
    // because stock cannot be restored via cancel transition.
    const order = await seedPendingOrder();
    try {
      await seedShipment({
        orderId: order.id,
        carrierName: "DHL",
        trackingNumber: "NO-DELETE",
      });
      await setOrderStatus(order.id, "delivered");

      await page.goto(adminOrderPath(order.id));
      await expect(
        page.getByRole("heading", { name: /order details/i }),
      ).toBeVisible();
      await expect(page.getByText(/^delivered$/i).first()).toBeVisible();

      await page
        .getByRole("button", { name: new RegExp(`Delete order ${order.id}`, "i") })
        .click();
      await page.getByRole("button", { name: /^delete order$/i }).click();
      await expectToast(page, /failed to delete order/i);
      await expectToast(page, /cannot delete order in status "delivered"/i);
      await expect(page).toHaveURL(/\/admin\/orders\//);
      await expect(
        page.getByRole("heading", { name: /order details/i }),
      ).toBeVisible();
    } finally {
      await deleteOrderById(order.id);
    }
  });
});
