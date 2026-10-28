import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ADMIN_COOKIE_NAME, AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const adminCount = await User.countDocuments({ role: "admin" });
  return NextResponse.json({
    success: true,
    initialized: adminCount > 0,
  });
}

export async function POST(req: NextRequest) {
  const rateLimitRes = enforceRateLimit(req, {
    namespace: "admin:register",
    limit: 5,
    windowSeconds: 15 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    await connectDB();

    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      return NextResponse.json(
        {
          success: false,
          code: "ADMIN_ALREADY_INITIALIZED",
          message:
            "One-time Admin registration is permanently locked because an Admin already exists. Only an existing Admin can create new Admins.",
        },
        { status: 403 }
      );
    }

    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { success: false, message: "Admin password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const admin = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "admin",
      plan: "enterprise",
      isActive: true,
      isFrozen: false,
      isLocked: false,
      isEmailVerified: true,
      allowMultipleProjects: true,
      maxProjects: 50,
      dailyQuota: 2000,
      lastLoginAt: new Date(),
    });

    const token = signAuthToken({
      userId: String(admin._id),
      email: admin.email,
      role: "admin",
    });

    const res = NextResponse.json(
      {
        success: true,
        message: "Primary Administrator account initialized!",
        data: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 201 }
    );

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
    console.error("[POST /api/admin/auth/register] Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to initialize admin" },
      { status: 500 }
    );
  }
}
