import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { MailProject } from "@/models/MailProject";
import { getCurrentUser, AUTH_COOKIE_NAME } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "auth:delete-account",
    limit: 3,
    windowSeconds: 60 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  const sessionUser = await getCurrentUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { password } = await req.json().catch(() => ({}));
  if (!password) {
    return NextResponse.json({ success: false, message: "Password is required to confirm deletion." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(sessionUser._id);
  if (!user) {
    return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
  }

  if (user.role === "admin") {
    return NextResponse.json({ success: false, message: "Admin accounts cannot be self-deleted. Contact another administrator." }, { status: 403 });
  }

  const passwordMatch = await bcrypt.compare(String(password), user.passwordHash);
  if (!passwordMatch) {
    return NextResponse.json({ success: false, message: "Incorrect password." }, { status: 400 });
  }

  const deletedAt = new Date();

  // Soft delete: mark deletedAt, revoke all projects, lock account
  await User.collection.updateOne(
    { _id: user._id },
    {
      $set: {
        deletedAt,
        isLocked: true,
        isActive: false,
        lockReason: "Account scheduled for deletion.",
      },
    }
  );

  // Revoke all projects so API keys stop working immediately
  await MailProject.updateMany(
    { userId: user._id },
    { $set: { isRevoked: true, isActive: false } }
  );

  const res = NextResponse.json({
    success: true,
    message: "Your account has been scheduled for deletion. All access has been revoked. Your data will be permanently deleted within 30 days.",
  });

  // Clear session cookie
  res.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}
