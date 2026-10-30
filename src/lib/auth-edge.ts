/**
 * Edge-safe auth helpers — no mongoose, no next/headers.
 * Import this from middleware.ts only.
 */
import { jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "mail_service_token";
export const ADMIN_COOKIE_NAME = "mail_service_admin_token";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

function getSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET || "dev-jwt-secret-change-in-prod";
  return new TextEncoder().encode(secret);
}

export async function verifyAuthTokenEdge(
  token: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
