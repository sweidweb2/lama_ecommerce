import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV (recommended for GCM)
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag (required for Node AES-GCM)
const MIN_CIPHERTEXT_LENGTH = IV_LENGTH + AUTH_TAG_LENGTH + 1;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Gets the encryption key from environment variable.
 * Expects a 64-character hex string (32 bytes = 256 bits).
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  if (keyHex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(keyHex, "hex");
}

function restoreBase64(encryptedId: string): string {
  let base64 = encryptedId.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  return base64;
}

/**
 * Encrypts a string (order ID) using AES-256-GCM.
 * Returns a URL-safe base64-encoded string containing IV, encrypted content, and auth tag.
 *
 * Format: base64(iv:tag:encrypted)
 *
 * Threat model: ciphertext obscures the UUID and GCM rejects tampering. There is **no TTL** —
 * links remain decryptable indefinitely while `ENCRYPTION_KEY` is unchanged. Possession of the
 * ciphertext is **not** authorization to view an order; callers must still enforce ownership
 * (user id / guest session) after decrypt.
 */
export function encryptOrderId(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();
    if (tag.length !== AUTH_TAG_LENGTH) {
      throw new Error("Unexpected auth tag length");
    }

    const combined = Buffer.concat([iv, tag, encrypted]);
    const base64 = combined.toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt order ID");
  }
}

/**
 * Decrypts an encrypted order ID string.
 * Expects a URL-safe base64-encoded string containing IV, auth tag, and encrypted content.
 *
 * Success only proves the payload was produced with this key (and was not altered). It does
 * **not** grant read access — ownership checks remain required after decrypt. Ciphertext has
 * no expiry; invalid/corrupt input throws.
 */
export function decryptOrderId(encryptedId: string): string {
  const combined = Buffer.from(restoreBase64(encryptedId), "base64");

  if (combined.length < MIN_CIPHERTEXT_LENGTH) {
    throw new Error("Failed to decrypt order ID. Invalid or corrupted data.");
  }

  try {
    const key = getEncryptionKey();
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    if (tag.length !== AUTH_TAG_LENGTH) {
      throw new Error("Failed to decrypt order ID. Invalid or corrupted data.");
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Failed to decrypt order ID")
    ) {
      throw error;
    }
    throw new Error("Failed to decrypt order ID. Invalid or corrupted data.");
  }
}

/**
 * Resolves a route param that may be either a raw UUID or an encrypted id.
 * Raw UUIDs skip decrypt (avoids AES-GCM noise on list/detail links).
 */
export function resolveEncryptedOrRawId(param: string): string {
  const decoded = decodeURIComponent(param);
  if (UUID_RE.test(decoded)) {
    return decoded;
  }
  return decryptOrderId(decoded);
}
