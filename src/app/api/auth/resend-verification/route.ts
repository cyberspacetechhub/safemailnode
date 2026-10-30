import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmailToUser } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "auth:resend-verification",
    limit: 5,
    windowSeconds: 10 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (user.isEmailVerified) {
    return NextResponse.json({
      success: true,
      message: "Your email is already verified.",
    });
  }

  const newCode = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await User.collection.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationCode: newCode,
        emailVerificationExpires: expiresAt,
      },
    }
  );

  const mailResult = await sendVerificationEmailToUser(user.email, user.name, newCode);

  if (!mailResult.sent) {
    return NextResponse.json(
      {
        success: false,
        message:
          mailResult.error ||
          "Could not dispatch verification email yet. Please contact the administrator.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `A new 6-digit verification code has been sent to ${user.email}.`,
  });
}
