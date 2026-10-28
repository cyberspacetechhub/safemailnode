import crypto from "crypto";

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
 */
export function generateApiKey(): string {
  return `ms_live_${crypto.randomBytes(24).toString("hex")}`;
}
