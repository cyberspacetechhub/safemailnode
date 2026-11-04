import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { AuditLog } from "@/models/AuditLog";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { enforceRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendLoginAlertEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
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

    if (user.deletedAt) {
      return NextResponse.json(
        { success: false, message: "This account has been deleted." },
        { status: 403 }
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

    const ip = getClientIp(req);
    const ua = req.headers.get("user-agent") || "Unknown device";
    const sessionId = crypto.randomBytes(32).toString("hex");

    // Create session record
    await Session.create({ sessionId, userId: user._id, ip, userAgent: ua, lastActiveAt: new Date() });

    // Audit log
    await AuditLog.create({ userId: user._id, action: "login", ip, userAgent: ua });

    // Suspicious login alert — fire if user has logged in before (has lastLoginAt)
    const prevIp = (user as any).lastLoginIp;
    if (prevIp && prevIp !== ip) {
      const time = new Date().toUTCString();
      sendLoginAlertEmail(user.email, user.name, ip, ua, time);
    }

    // Store last login IP for next comparison
    await User.collection.updateOne({ _id: user._id }, { $set: { lastLoginIp: ip } });

    const token = signAuthToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      sessionId,
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
