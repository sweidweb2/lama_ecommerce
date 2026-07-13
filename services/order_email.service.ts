import {
  getOrderByIdForAdmin,
  getOrderItemsByOrderIdForAdmin,
} from "@/repositories/order.repository";
import { buildOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { sendEmail } from "@/lib/email/resend";

/**
 * Load the order (service role) and send a confirmation email.
 * Safe to fire-and-forget after checkout — never throws for missing email/config.
 */
export async function sendOrderConfirmationEmailService(
  orderId: string,
): Promise<void> {
  const order = await getOrderByIdForAdmin(orderId);
  if (!order) {
    console.error(
      "sendOrderConfirmationEmailService: order not found",
      orderId,
    );
    return;
  }

  const to = order.email?.trim();
  if (!to) {
    console.warn(
      "sendOrderConfirmationEmailService: order has no email, skipping",
      orderId,
    );
    return;
  }

  const items = await getOrderItemsByOrderIdForAdmin(orderId);
  const { subject, html } = buildOrderConfirmationEmail(order, items);
  const result = await sendEmail({ to, subject, html });

  if (!result.sent && !result.skipped) {
    throw new Error(
      result.error ?? "Failed to send order confirmation email",
    );
  }
}
