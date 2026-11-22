import { encryptOrderId } from "@/lib/utils/encryption";
import { signOrderAccessToken } from "@/lib/auth/order-access-token";

export function orderDetailsPath(orderId: string): string {
  return `/order_details/${encodeURIComponent(encryptOrderId(orderId))}`;
}

export function orderDetailsPathWithToken(orderId: string): string {
  const enc = encryptOrderId(orderId);
  const token = signOrderAccessToken(orderId);
  return `/order_details/${encodeURIComponent(enc)}?t=${encodeURIComponent(token)}`;
}

export function orderShortCode(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}
