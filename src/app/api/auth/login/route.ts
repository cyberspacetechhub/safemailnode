import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rateLimitRes = enforceRateLimit(req, {
    namespace: "auth:login",
    limit: 8,
    windowSeconds: 15 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been suspended by an administrator.",
        },
        { status: 403 }
      );
    }

    if (user.isLocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            user.lockReason ||
            "Your account is locked for security reasons. Please contact an administrator.",
        },
        { status: 423 }
      );
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
        user.lockReason = "Account automatically locked after 5 consecutive failed login attempts.";
      }
      await user.save();

      return NextResponse.json(
        {
          success: false,
          message: user.isLocked
            ? "Account locked due to 5 failed login attempts. Contact administrator."
            : "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    await user.save();

    const token = signAuthToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      success: true,
      requiresVerification: !user.isEmailVerified,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        isEmailVerified: user.isEmailVerified,
        isFrozen: user.isFrozen,
        allowMultipleProjects: user.allowMultipleProjects,
        maxProjects: user.maxProjects,
        dailyQuota: user.dailyQuota,
      },
    });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    console.error("[POST /api/auth/login] Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Login failed" },
      { status: 500 }
    );
  }
}
