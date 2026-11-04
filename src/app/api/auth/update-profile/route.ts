import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getCurrentUser, AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmailToUser, sendEmailChangedNotification } from "@/lib/mailer";
import { AuditLog } from "@/models/AuditLog";

export async function PATCH(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "auth:update-profile",
    limit: 10,
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
  if (!body) {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  const unsets: Record<string, string> = {};

  // Name update
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ success: false, message: "Name cannot be empty." }, { status: 400 });
    updates.name = name;
  }

  // Email update — requires re-verification
  let emailChanged = false;
  let newEmail = "";
  if (body.email !== undefined) {
    newEmail = String(body.email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
    }
    if (newEmail === rawUser.email) {
      return NextResponse.json({ success: false, message: "This is already your current email address." }, { status: 400 });
    }
    const existing = await User.collection.findOne({ email: newEmail });
    if (existing) {
      return NextResponse.json({ success: false, message: "An account with this email already exists." }, { status: 409 });
    }

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    updates.email = newEmail;
    updates.isEmailVerified = false;
    updates.emailVerificationCode = code;
    updates.emailVerificationExpires = expiresAt;
    unsets.passwordResetToken = "";
    unsets.passwordResetExpires = "";
    emailChanged = true;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, message: "No changes provided." }, { status: 400 });
  }

  const op: Record<string, unknown> = { $set: updates };
  if (Object.keys(unsets).length > 0) op.$unset = unsets;
  await User.collection.updateOne({ _id: sessionUser._id }, op);

  if (emailChanged) {
    const oldEmail = rawUser.email;
    sendEmailChangedNotification(newEmail, rawUser.name, oldEmail);
    sendVerificationEmailToUser(newEmail, rawUser.name, updates.emailVerificationCode as string);
    await AuditLog.create({ userId: sessionUser._id, action: "email_changed", detail: `${oldEmail} → ${newEmail}` });
  } else if (updates.name) {
    await AuditLog.create({ userId: sessionUser._id, action: "profile_updated" });
  }

  // Re-issue JWT if email changed so the cookie stays valid
  const updatedUser = await User.collection.findOne({ _id: sessionUser._id });
  const res = NextResponse.json({
    success: true,
    emailChanged,
    message: emailChanged
      ? `Email updated to ${newEmail}. Please verify your new address.`
      : "Profile updated successfully.",
    data: { name: updatedUser?.name, email: updatedUser?.email },
  });

  if (emailChanged && updatedUser) {
    const token = signAuthToken({ userId: String(updatedUser._id), email: updatedUser.email, role: updatedUser.role });
    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return res;
}
