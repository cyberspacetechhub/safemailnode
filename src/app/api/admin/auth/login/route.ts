import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ADMIN_COOKIE_NAME, AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "admin:login",
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Admin email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "This administrator account is deactivated." },
        { status: 403 }
      );
    }

    if (user.isLocked) {
      return NextResponse.json(
        {
          success: false,
          message: user.lockReason || "This administrator account is locked.",
        },
        { status: 423 }
      );
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
        user.lockReason = "Admin account locked after 5 failed login attempts.";
      }
      await user.save();

      return NextResponse.json(
        {
          success: false,
          message: user.isLocked
            ? "Account locked after 5 failed attempts."
            : "Invalid administrator credentials.",
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
      role: "admin",
    });

    const res = NextResponse.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    const cookieOpts = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };

    res.cookies.set(ADMIN_COOKIE_NAME, token, cookieOpts);
    res.cookies.set(AUTH_COOKIE_NAME, token, cookieOpts);

    return res;
  } catch (error: any) {
    console.error("[POST /api/admin/auth/login] Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Admin login failed" },
      { status: 500 }
    );
  }
}
