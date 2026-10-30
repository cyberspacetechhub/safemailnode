import crypto from "crypto";
import bcrypt from "bcryptjs";

const ALGORITHM = "aes-256-gcm";

function getSecretKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_SECRET ||
    process.env.JWT_SECRET ||
    "default-fallback-secret-change-in-production-32b";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive strings (such as Gmail 16-char App Passwords) using AES-256-GCM.
 */
export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const key = getSecretKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts AES-256-GCM encrypted strings back into plain text.
 */
export function decryptSecret(cipherText: string): string {
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted credential format");
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const key = getSecretKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Generates a unique API key prefixed with `ms_live_`
 * Returns { rawKey, hashedKey, prefix }
 */
export async function generateApiKey(): Promise<{
  rawKey: string;
  hashedKey: string;
  prefix: string;
}> {
  const rawKey = `ms_live_${crypto.randomBytes(24).toString("hex")}`;
  const hashedKey = await bcrypt.hash(rawKey, 10);
  // prefix = first 20 chars of the raw key for display (e.g. "ms_live_a1b2c3d4e5f6")
  const prefix = rawKey.slice(0, 20) + "...";
  return { rawKey, hashedKey, prefix };
}

/**
 * Verifies a raw API key against its stored bcrypt hash.
 */
export async function verifyApiKey(
  rawKey: string,
  hashedKey: string
): Promise<boolean> {
  return bcrypt.compare(rawKey, hashedKey);
}
