import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV (recommended for GCM)

/**
 * Gets the encryption key from environment variable.
 * Expects a 64-character hex string (32 bytes = 256 bits).
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypts a string (order ID) using AES-256-GCM.
 * Returns a URL-safe base64-encoded string containing IV, encrypted content, and auth tag.
 * 
 * Format: base64(iv:tag:encrypted)
 */
export function encryptOrderId(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    // Combine IV, tag, and encrypted content
    const combined = Buffer.concat([iv, tag, encrypted]);
    
    // Convert to base64 and make URL-safe
    const base64 = combined.toString('base64');
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt order ID');
  }
}

/**
 * Decrypts an encrypted order ID string.
 * Expects a URL-safe base64-encoded string containing IV, auth tag, and encrypted content.
 */
export function decryptOrderId(encryptedId: string): string {
  try {
    const key = getEncryptionKey();

    // Restore URL-safe base64 to standard base64
    let base64 = encryptedId
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }

    const combined = Buffer.from(base64, 'base64');

    // Extract IV, tag, and encrypted content
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + 16); // Auth tag is 16 bytes
    const encrypted = combined.subarray(IV_LENGTH + 16);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt order ID. Invalid or corrupted data.');
  }
}
