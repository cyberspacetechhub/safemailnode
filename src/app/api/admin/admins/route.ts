import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentAdmin } from "@/lib/auth";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const currentAdmin = await getCurrentAdmin(req);
  if (!currentAdmin) {
    return NextResponse.json({ success: false, message: "Administrator privileges required." }, { status: 403 });
  }

  await connectDB();
  const admins = await User.collection
    .find({ role: "admin" })
    .project({ passwordHash: 0 })
    .sort({ createdAt: 1 })
    .toArray();

  return NextResponse.json({ success: true, data: admins });
}

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "admin:create-admin",
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  const currentAdmin = await getCurrentAdmin(req);
  if (!currentAdmin) {
    return NextResponse.json({ success: false, message: "Administrator privileges required." }, { status: 403 });
  }

  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: "Name, email, and password are required." }, { status: 400 });
    }

    if (String(password).length < 8) {
      return NextResponse.json({ success: false, message: "Admin password must be at least 8 characters." }, { status: 400 });
    }

    await connectDB();
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ success: false, message: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const newAdmin = await User.create({
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
      acceptedTermsAt: new Date(),
    });

    return NextResponse.json(
      { success: true, message: `Admin account created for ${newAdmin.email}`, data: { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Failed to create admin" }, { status: 500 });
  }
}
