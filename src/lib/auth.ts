import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { connectDB } from "./db";
import { User, IUser } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-prod";
export const AUTH_COOKIE_NAME = "mail_service_token";
export const ADMIN_COOKIE_NAME = "mail_service_admin_token";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "user" | "admin";
}

export function signAuthToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(req?: NextRequest): Promise<IUser | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }
    if (!token) {
      token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    }
  } else {
    const cookieStore = await cookies();
    token =
      cookieStore.get(AUTH_COOKIE_NAME)?.value ||
      cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  }

  if (!token) return null;

  const decoded = verifyAuthToken(token);
  if (!decoded) return null;

  await connectDB();
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive || user.isLocked) return null;

  return user;
}

/**
 * Specifically resolves the authenticated Administrator session (prioritizing ADMIN_COOKIE_NAME
 * so an Admin can test a regular user account in another tab of the same browser without losing admin session).
 */
export async function getCurrentAdmin(req?: NextRequest): Promise<IUser | null> {
  const candidateTokens: string[] = [];

  if (req) {
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (adminCookie) candidateTokens.push(adminCookie);

    const userCookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (userCookie) candidateTokens.push(userCookie);

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      candidateTokens.push(authHeader.slice(7));
    }
  } else {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (adminCookie) candidateTokens.push(adminCookie);
    const userCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (userCookie) candidateTokens.push(userCookie);
  }

  if (candidateTokens.length === 0) return null;

  await connectDB();

  for (const token of candidateTokens) {
    const decoded = verifyAuthToken(token);
    if (!decoded) continue;
    const user = await User.findById(decoded.userId);
    if (user && user.isActive && !user.isLocked && user.role === "admin") {
      return user;
    }
  }

  return null;
}
