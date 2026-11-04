import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { Session } from "@/models/Session";
import { AuditLog } from "@/models/AuditLog";
import { connectDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");

  const cookieName = scope === "admin" ? ADMIN_COOKIE_NAME : AUTH_COOKIE_NAME;
  const token = req.cookies.get(cookieName)?.value;

  if (token) {
    const decoded = verifyAuthToken(token);
    if (decoded?.sessionId) {
      await connectDB();
      await Session.deleteOne({ sessionId: decoded.sessionId });
      await AuditLog.create({ userId: decoded.userId, action: "logout" });
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(cookieName, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
