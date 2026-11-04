import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { Session } from "@/models/Session";
import { AuditLog } from "@/models/AuditLog";
import { connectDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const sessions = await Session.find({ userId: user._id }).sort({ lastActiveAt: -1 }).lean();

  // Mark which session is current
  const currentToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const currentDecoded = currentToken ? verifyAuthToken(currentToken) : null;

  return NextResponse.json({
    success: true,
    data: sessions.map((s) => ({
      sessionId: s.sessionId,
      ip: s.ip,
      userAgent: s.userAgent,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s.sessionId === currentDecoded?.sessionId,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { sessionId } = body || {};

  if (!sessionId) {
    return NextResponse.json({ success: false, message: "sessionId is required" }, { status: 400 });
  }

  await connectDB();
  const result = await Session.deleteOne({ sessionId, userId: user._id });

  if (result.deletedCount === 0) {
    return NextResponse.json({ success: false, message: "Session not found" }, { status: 404 });
  }

  await AuditLog.create({ userId: user._id, action: "session_revoked", detail: `Session ${sessionId.slice(0, 8)}...` });

  return NextResponse.json({ success: true, message: "Session revoked." });
}
