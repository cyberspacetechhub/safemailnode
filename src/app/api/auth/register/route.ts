import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { sendVerificationEmailToUser } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const rateLimitRes = enforceRateLimit(req, {
    namespace: "auth:register",
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const verificationCode = String(crypto.randomInt(100000, 999999));
    const verificationExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    // Regular user registration NEVER creates an admin.
    // Default limits: 2 projects, 100 daily emails (Admin can increase both per user).
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "user",
      plan: "free",
      allowMultipleProjects: true,
      maxProjects: 2,
      dailyQuota: 100,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
      lastLoginAt: new Date(),
    });

    await User.collection.updateOne(
      { _id: user._id },
      {
        $set: {
          isEmailVerified: false,
          emailVerificationCode: verificationCode,
          emailVerificationExpires: verificationExpires,
        },
      }
    );

    const mailResult = await sendVerificationEmailToUser(
      user.email,
      user.name,
      verificationCode
    );

    const token = signAuthToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        emailDispatched: mailResult.sent,
        message: mailResult.sent
          ? "Account created! Please check your email for your 6-digit verification code."
          : "Account created! Verification email is pending system mailer setup.",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          isEmailVerified: user.isEmailVerified,
          maxProjects: user.maxProjects,
          dailyQuota: user.dailyQuota,
        },
      },
      { status: 201 }
    );

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error: any) {
    console.error("[POST /api/auth/register] Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Registration failed" },
      { status: 500 }
    );
  }
}
