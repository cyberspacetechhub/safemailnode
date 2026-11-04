import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sendPasswordChangedNotification } from "@/lib/mailer";
import { AuditLog } from "@/models/AuditLog";

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "auth:change-password",
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  const sessionUser = await getCurrentUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const rawUser = await User.collection.findOne({ _id: sessionUser._id });
  if (!rawUser) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const { currentPassword, newPassword } = body || {};

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ success: false, message: "Current and new password are required." }, { status: 400 });
  }

  if (String(newPassword).length < 6) {
    return NextResponse.json({ success: false, message: "New password must be at least 6 characters." }, { status: 400 });
  }

  const valid = await bcrypt.compare(String(currentPassword), rawUser.passwordHash);
  if (!valid) {
    return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 400 });
  }

  if (String(currentPassword) === String(newPassword)) {
    return NextResponse.json({ success: false, message: "New password must be different from your current password." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await User.collection.updateOne({ _id: sessionUser._id }, { $set: { passwordHash } });

  sendPasswordChangedNotification(rawUser.email, rawUser.name);
  await AuditLog.create({ userId: sessionUser._id, action: "password_changed" });

  return NextResponse.json({ success: true, message: "Password changed successfully." });
}
