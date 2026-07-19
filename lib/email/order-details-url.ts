import { signOrderAccessToken } from "@/lib/auth/order-access-token";
import { encryptOrderId } from "@/lib/utils/encryption";

/**
 * Public order-details URL with encrypted id path + signed bearer `t` query param.
 * Returns null when site base URL or ENCRYPTION_KEY is unavailable.
 */
export function buildSignedOrderDetailsUrl(orderId: string): string | null {
  const base =
    process.env.EMAIL_ORDER_DETAILS_BASE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    null;
  if (!base) {
    return null;
  }

  try {
    const encryptedId = encryptOrderId(orderId);
    const token = signOrderAccessToken(orderId);
    return `${base}/order_details/${encodeURIComponent(encryptedId)}?t=${encodeURIComponent(token)}`;
  } catch (error) {
    console.error("Failed to build signed order details URL:", error);
    return null;
  }
}
