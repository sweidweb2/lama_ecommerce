import { describe, expect, it } from "vitest";
import {
  formatOrderCurrency,
  getOrderRestockMessage,
  getShipmentEmptyCopy,
  getShipmentEmptyKind,
  shouldShowOrderStatusBanner,
} from "@/lib/orders/order-display";

describe("shouldShowOrderStatusBanner", () => {
  it("shows for cancelled, failed, or refunded", () => {
    expect(
      shouldShowOrderStatusBanner({
        status: "cancelled",
        payment_status: "paid",
      }),
    ).toBe(true);
    expect(
      shouldShowOrderStatusBanner({
        status: "pending",
        payment_status: "failed",
      }),
    ).toBe(true);
    expect(
      shouldShowOrderStatusBanner({
        status: "delivered",
        payment_status: "refunded",
      }),
    ).toBe(true);
  });

  it("hides for normal paid orders", () => {
    expect(
      shouldShowOrderStatusBanner({
        status: "processing",
        payment_status: "paid",
      }),
    ).toBe(false);
  });
});

describe("getOrderRestockMessage", () => {
  it("returns restock copy only when stock_restored is true", () => {
    expect(getOrderRestockMessage(true)).toMatch(/restored/i);
    expect(getOrderRestockMessage(false)).toBeNull();
    expect(getOrderRestockMessage(undefined)).toBeNull();
  });
});

describe("getShipmentEmptyKind / copy", () => {
  it("uses awaiting copy for pre-ship statuses", () => {
    expect(getShipmentEmptyKind("pending")).toBe("awaiting");
    expect(getShipmentEmptyKind("processing")).toBe("awaiting");
    expect(getShipmentEmptyKind("packed")).toBe("awaiting");
    expect(getShipmentEmptyCopy("awaiting").title).toBe("Not shipped yet");
  });

  it("uses missing tracking for shipped/delivered without row", () => {
    expect(getShipmentEmptyKind("shipped")).toBe("missing_tracking");
    expect(getShipmentEmptyKind("delivered")).toBe("missing_tracking");
  });

  it("uses not shipped for cancelled/returned", () => {
    expect(getShipmentEmptyKind("cancelled")).toBe("not_shipped");
    expect(getShipmentEmptyKind("returned")).toBe("not_shipped");
    expect(getShipmentEmptyCopy("not_shipped").title).toBe("Not shipped");
  });
});

describe("formatOrderCurrency", () => {
  it("formats zero and null distinctly as $0.00", () => {
    expect(formatOrderCurrency(0)).toBe("$0.00");
    expect(formatOrderCurrency(null)).toBe("$0.00");
    expect(formatOrderCurrency(12.5)).toBe("$12.50");
  });
});
