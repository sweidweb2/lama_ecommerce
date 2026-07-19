import crypto from "crypto";

/** Align with guest_session_id cookie TTL (14 days). */
export const ORDER_ACCESS_TOKEN_TTL_SECONDS = 14 * 24 * 60 * 60;

function getSigningKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  if (keyHex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(keyHex, "hex");
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Sign a bearer token for viewing a specific order without the guest cookie.
 * Format: base64url(orderId.exp).hmac
 */
export function signOrderAccessToken(
  orderId: string,
  ttlSeconds: number = ORDER_ACCESS_TOKEN_TTL_SECONDS,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${orderId}.${exp}`;
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningKey())
    .update(payload)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

/**
 * Verify a bearer token for the expected order id. Fail closed on expiry/tamper/mismatch.
 */
export function verifyOrderAccessToken(
  token: string,
  expectedOrderId: string,
): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [payloadB64, sig] = parts;
    if (!payloadB64 || !sig) return false;

    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const expectedSig = crypto
      .createHmac("sha256", getSigningKey())
      .update(payload)
      .digest("base64url");

    if (!timingSafeEqualString(sig, expectedSig)) return false;

    const lastDot = payload.lastIndexOf(".");
    if (lastDot <= 0) return false;

    const orderId = payload.slice(0, lastDot);
    const exp = Number(payload.slice(lastDot + 1));
    if (!orderId || !Number.isFinite(exp)) return false;
    if (orderId !== expectedOrderId) return false;
    if (exp < Math.floor(Date.now() / 1000)) return false;

    return true;
  } catch {
    return false;
  }
}
