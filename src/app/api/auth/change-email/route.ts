import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmailToUser } from "@/lib/mailer";
import { connectDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "auth:change-email",
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

  if (rawUser.isEmailVerified) {
    return NextResponse.json(
      { success: false, message: "Your email is already verified. You cannot change it here." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const newEmail = String(body?.email || "").toLowerCase().trim();

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json(
      { success: false, message: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  if (newEmail === rawUser.email) {
    return NextResponse.json(
      { success: false, message: "This is already your registered email address." },
      { status: 400 }
    );
  }

  const existing = await User.collection.findOne({ email: newEmail });
  if (existing) {
    return NextResponse.json(
      { success: false, message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const newCode = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await User.collection.updateOne(
    { _id: sessionUser._id },
    {
      $set: {
        email: newEmail,
        emailVerificationCode: newCode,
        emailVerificationExpires: expiresAt,
      },
    }
  );

  const mailResult = await sendVerificationEmailToUser(newEmail, rawUser.name, newCode);

  return NextResponse.json({
    success: true,
    email: newEmail,
    emailDispatched: mailResult.sent,
    message: mailResult.sent
      ? `Verification code sent to ${newEmail}.`
      : `Email updated to ${newEmail}. Verification email is pending system mailer setup.`,
  });
}
