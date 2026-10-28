import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rateLimitRes = enforceRateLimit(req, {
    namespace: "auth:verify-email",
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  const sessionUser = await getCurrentUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // Fetch raw document directly to guarantee latest fields even across hot-reloads
  const rawUser = await User.collection.findOne({ _id: sessionUser._id });
  if (!rawUser) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  if (rawUser.isEmailVerified) {
    return NextResponse.json({
      success: true,
      message: "Email is already verified.",
    });
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").replace(/\s+/g, "");

  if (!code || code.length !== 6) {
    return NextResponse.json(
      { success: false, message: "Please enter a valid 6-digit verification code." },
      { status: 400 }
    );
  }

  const storedCode = rawUser.emailVerificationCode
    ? String(rawUser.emailVerificationCode).trim()
    : "";

  if (!storedCode || storedCode !== code) {
    return NextResponse.json(
      {
        success: false,
        message: !storedCode
          ? "No active verification code found. Please click 'Resend Code' and enter the new code."
          : "Invalid verification code. Please check the 6-digit code and try again.",
      },
      { status: 400 }
    );
  }

  if (
    rawUser.emailVerificationExpires &&
    new Date(rawUser.emailVerificationExpires).getTime() < Date.now()
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Verification code has expired. Please request a new code.",
      },
      { status: 400 }
    );
  }

  await User.collection.updateOne(
    { _id: sessionUser._id },
    {
      $set: { isEmailVerified: true },
      $unset: { emailVerificationCode: "", emailVerificationExpires: "" },
    }
  );

  return NextResponse.json({
    success: true,
    message: "Email verified successfully!",
  });
}
