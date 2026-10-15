import {
  findOrderByEmailAndShortId,
} from "@/repositories/order.repository";
import { buildSignedOrderDetailsUrl } from "@/lib/email/order-details-url";
import { sendEmail } from "@/lib/email/resend";
import type { FindOrderInput } from "@/lib/validators/order/find";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * If email + short order id uniquely match, email a signed details link.
 * Always returns success to the caller for enumeration safety (except hard failures like rate limit upstream).
 */
export async function requestOrderAccessLinkService(
  input: FindOrderInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const order = await findOrderByEmailAndShortId(
      input.email,
      input.shortOrderId,
    );

    if (!order) {
      return { success: true };
    }

    const detailsUrl = buildSignedOrderDetailsUrl(order.id);
    if (!detailsUrl) {
      console.error(
        "requestOrderAccessLinkService: could not build signed URL",
        order.id,
      );
      return { success: true };
    }

    const shortId = order.id.slice(0, 8).toUpperCase();
    const subject = `Your order link #${shortId}`;
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:32px auto;padding:32px 28px;background:#fff;border:1px solid #e8e4de;">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8a8278;">Aviora Wear</p>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:normal;color:#1a1a1a;">Order access link</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#4a453f;">
      Use this link to view order <strong>#${escapeHtml(shortId)}</strong>. It works without the browser cookie from checkout and expires in 14 days.
    </p>
    <p style="margin:24px 0 0;">
      <a href="${escapeHtml(detailsUrl)}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 20px;font-size:14px;">
        View order details
      </a>
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#6b6560;">Or open: ${escapeHtml(detailsUrl)}</p>
  </div>
</body>
</html>`;

    const result = await sendEmail({
      to: input.email,
      subject,
      html,
    });

    if (!result.sent && !result.skipped) {
      console.error(
        "requestOrderAccessLinkService: send failed",
        result.error,
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in requestOrderAccessLinkService:", error);
    return {
      success: false,
      error: "Unable to process request. Please try again.",
    };
  }
}
