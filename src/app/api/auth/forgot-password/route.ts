import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "auth:forgot-password",
    limit: 3,
    windowSeconds: 15 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });

    // Always return success to prevent email enumeration
    const generic = { success: true, message: "If that email exists, a reset link has been sent." };

    if (!user) return NextResponse.json(generic);

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 30 * 60 * 1000);

    await User.collection.updateOne(
      { _id: user._id },
      { $set: { passwordResetToken: token, passwordResetExpires: expires } }
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    return NextResponse.json(generic);
  } catch (error: any) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
