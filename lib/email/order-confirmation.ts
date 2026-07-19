import { buildSignedOrderDetailsUrl } from "@/lib/email/order-details-url";
import type { Order, OrderItem } from "@/types/order";

function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  return Number(value).toFixed(2);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function variantLabel(item: OrderItem): string {
  const parts = [item.size_snapshot, item.material_snapshot, item.color_snapshot]
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => escapeHtml(part));
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function buildOrderDetailsUrl(orderId: string): string | null {
  return buildSignedOrderDetailsUrl(orderId);
}

export interface OrderConfirmationEmailContent {
  subject: string;
  html: string;
}

/**
 * Build subject + HTML body for an order confirmation email.
 * Uses denormalized order_item snapshots; optional details link when a site URL env is set.
 */
export function buildOrderConfirmationEmail(
  order: Order,
  items: OrderItem[],
): OrderConfirmationEmailContent {
  const shortId = order.id.slice(0, 8).toUpperCase();
  const subject = `Order confirmation #${shortId}`;
  const detailsUrl = buildOrderDetailsUrl(order.id);
  const address = order.address_snapshot;

  const itemRows = items
    .map((item) => {
      const name = escapeHtml(item.product_name_snapshot ?? "Item");
      const lineTotal =
        item.price_snapshot != null
          ? Number(item.price_snapshot) * item.quantity
          : null;
      return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e8e4de;">
            <div style="font-weight:600;color:#1a1a1a;">${name}</div>
            <div style="font-size:13px;color:#6b6560;margin-top:4px;">${variantLabel(item)}</div>
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e8e4de;text-align:center;color:#1a1a1a;">${item.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e8e4de;text-align:right;color:#1a1a1a;">${formatMoney(item.price_snapshot)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e8e4de;text-align:right;color:#1a1a1a;">${formatMoney(lineTotal)}</td>
        </tr>`;
    })
    .join("");

  const addressBlock = address
    ? `
      <p style="margin:0 0 4px;color:#1a1a1a;">
        ${escapeHtml(address.address)}<br/>
        ${escapeHtml(address.city)}${address.postal_code ? `, ${escapeHtml(address.postal_code)}` : ""}<br/>
        ${escapeHtml(address.country)}
      </p>`
    : `<p style="margin:0;color:#6b6560;">No address on file</p>`;

  const detailsLink = detailsUrl
    ? `<p style="margin:24px 0 0;">
         <a href="${escapeHtml(detailsUrl)}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 20px;font-size:14px;">
           View order details
         </a>
       </p>
       <p style="margin:8px 0 0;font-size:12px;color:#6b6560;">Or open: ${escapeHtml(detailsUrl)}</p>`
    : `<p style="margin:24px 0 0;font-size:13px;color:#6b6560;">Order ID: <code>${escapeHtml(order.id)}</code></p>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:32px auto;padding:32px 28px;background:#fff;border:1px solid #e8e4de;">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;">Lama</p>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:normal;color:#1a1a1a;">Order confirmed</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#4a453f;">
      Thanks for your order. We received it and will follow up when payment and shipping progress.
    </p>

    <p style="margin:0 0 16px;font-size:14px;color:#6b6560;">
      Order <strong style="color:#1a1a1a;">#${escapeHtml(shortId)}</strong>
      · Status: ${escapeHtml(order.status)}
      · Payment: ${escapeHtml(order.payment_status)}
    </p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:2px solid #1a1a1a;color:#1a1a1a;">Item</th>
          <th style="text-align:center;padding:8px;border-bottom:2px solid #1a1a1a;color:#1a1a1a;">Qty</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #1a1a1a;color:#1a1a1a;">Price</th>
          <th style="text-align:right;padding:8px;border-bottom:2px solid #1a1a1a;color:#1a1a1a;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || `<tr><td colspan="4" style="padding:12px 8px;color:#6b6560;">No line items</td></tr>`}
      </tbody>
    </table>

    <table style="width:100%;font-size:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:4px 0;color:#6b6560;">Subtotal</td>
        <td style="padding:4px 0;text-align:right;color:#1a1a1a;">${formatMoney(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#6b6560;">Shipping${order.shipping_zone_name ? ` (${escapeHtml(order.shipping_zone_name)})` : ""}</td>
        <td style="padding:4px 0;text-align:right;color:#1a1a1a;">${formatMoney(order.shipping_fee)}</td>
      </tr>
      ${
        order.discount != null && Number(order.discount) > 0
          ? `<tr>
              <td style="padding:4px 0;color:#6b6560;">Discount</td>
              <td style="padding:4px 0;text-align:right;color:#1a1a1a;">−${formatMoney(order.discount)}</td>
            </tr>`
          : ""
      }
      <tr>
        <td style="padding:10px 0 0;font-weight:600;color:#1a1a1a;">Total</td>
        <td style="padding:10px 0 0;text-align:right;font-weight:600;color:#1a1a1a;">${formatMoney(order.total)}</td>
      </tr>
    </table>

    <div style="border-top:1px solid #e8e4de;padding-top:20px;font-size:14px;">
      <p style="margin:0 0 8px;font-weight:600;color:#1a1a1a;">Shipping to</p>
      ${addressBlock}
      ${order.phone ? `<p style="margin:8px 0 0;color:#6b6560;">Phone: ${escapeHtml(order.phone)}</p>` : ""}
    </div>

    ${detailsLink}
  </div>
</body>
</html>`;

  return { subject, html };
}
