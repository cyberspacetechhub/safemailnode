import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "auth:reset-password",
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ success: false, message: "Token and password are required." }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ success: false, message: "Password must be at least 6 characters." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({
      passwordResetToken: String(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Reset link is invalid or has expired." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    await User.collection.updateOne(
      { _id: user._id },
      {
        $set: { passwordHash, failedLoginAttempts: 0, isLocked: false },
        $unset: { passwordResetToken: "", passwordResetExpires: "" },
      }
    );

    return NextResponse.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error: any) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
