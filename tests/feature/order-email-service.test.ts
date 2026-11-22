import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrderByIdForAdmin = vi.fn();
const getOrderItemsByOrderIdForAdmin = vi.fn();
const buildOrderConfirmationEmail = vi.fn();
const sendEmail = vi.fn();

vi.mock("@/repositories/order.repository", () => ({
  getOrderByIdForAdmin: (...args: unknown[]) => getOrderByIdForAdmin(...args),
  getOrderItemsByOrderIdForAdmin: (...args: unknown[]) =>
    getOrderItemsByOrderIdForAdmin(...args),
}));

vi.mock("@/lib/email/order-confirmation", () => ({
  buildOrderConfirmationEmail: (...args: unknown[]) =>
    buildOrderConfirmationEmail(...args),
}));

vi.mock("@/lib/email/resend", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

describe("order_email.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns early when order is missing", async () => {
    getOrderByIdForAdmin.mockResolvedValue(null);
    const { sendOrderConfirmationEmailService } = await import(
      "@/services/order_email.service"
    );
    await expect(
      sendOrderConfirmationEmailService("order-1"),
    ).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("skips send when order has no email", async () => {
    getOrderByIdForAdmin.mockResolvedValue({ id: "order-1", email: null });
    const { sendOrderConfirmationEmailService } = await import(
      "@/services/order_email.service"
    );
    await expect(
      sendOrderConfirmationEmailService("order-1"),
    ).resolves.toBeUndefined();
    expect(getOrderItemsByOrderIdForAdmin).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends confirmation email for order with email", async () => {
    getOrderByIdForAdmin.mockResolvedValue({
      id: "order-1",
      email: "buyer@example.com",
    });
    getOrderItemsByOrderIdForAdmin.mockResolvedValue([{ id: "oi1" }]);
    buildOrderConfirmationEmail.mockReturnValue({
      subject: "Order confirmed",
      html: "<p>ok</p>",
    });
    sendEmail.mockResolvedValue({ sent: true, id: "email-1" });

    const { sendOrderConfirmationEmailService } = await import(
      "@/services/order_email.service"
    );
    await expect(
      sendOrderConfirmationEmailService("order-1"),
    ).resolves.toBeUndefined();
    expect(sendEmail).toHaveBeenCalledWith({
      to: "buyer@example.com",
      subject: "Order confirmed",
      html: "<p>ok</p>",
    });
  });

  it("throws when send fails (not skipped)", async () => {
    getOrderByIdForAdmin.mockResolvedValue({
      id: "order-1",
      email: "buyer@example.com",
    });
    getOrderItemsByOrderIdForAdmin.mockResolvedValue([]);
    buildOrderConfirmationEmail.mockReturnValue({
      subject: "Order confirmed",
      html: "<p>ok</p>",
    });
    sendEmail.mockResolvedValue({
      sent: false,
      skipped: false,
      error: "Resend down",
    });

    const { sendOrderConfirmationEmailService } = await import(
      "@/services/order_email.service"
    );
    await expect(
      sendOrderConfirmationEmailService("order-1"),
    ).rejects.toThrow("Resend down");
  });
});
