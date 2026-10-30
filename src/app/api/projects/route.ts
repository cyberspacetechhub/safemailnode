import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { MailProject } from "@/models/MailProject";
import { encryptSecret, generateApiKey } from "@/lib/crypto";
import { enforceRateLimit } from "@/lib/rateLimit";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await connectDB();
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const projects = await MailProject.find({ userId: user._id })
    .select("-encryptedAppPassword -hashedApiKey")
    .sort({ createdAt: -1 });

  return NextResponse.json(
    { success: true, data: projects },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}

export async function POST(req: NextRequest) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "projects:create",
    limit: 10,
    windowSeconds: 5 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  await connectDB();
  const sessionUser = await getCurrentUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const rawUser = await User.collection.findOne({ _id: sessionUser._id });
  if (!rawUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!rawUser.isEmailVerified) {
    return NextResponse.json(
      { success: false, message: "Please verify your email address before creating a Gmail project configuration." },
      { status: 403 }
    );
  }

  if (rawUser.isFrozen) {
    return NextResponse.json(
      { success: false, message: "Your account is currently frozen. You cannot create new projects right now." },
      { status: 403 }
    );
  }

  const existingCount = await MailProject.countDocuments({ userId: sessionUser._id });
  const effectiveMax = Math.max(Number(rawUser.maxProjects ?? 2), 1);
  if (existingCount >= effectiveMax) {
    return NextResponse.json(
      {
        success: false,
        code: "PROJECT_LIMIT_REACHED",
        message: `You have reached your project limit (${effectiveMax} projects). Contact an administrator to increase your project limit.`,
      },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { name, gmailUser, appPassword, defaultFromName, defaultReplyTo } = body;

  if (!name || !gmailUser || !appPassword) {
    return NextResponse.json(
      { success: false, message: "Project name, Gmail address, and 16-character App Password are required." },
      { status: 400 }
    );
  }

  const cleanAppPass = String(appPassword).replace(/\s+/g, "");
  if (cleanAppPass.length < 8) {
    return NextResponse.json(
      { success: false, message: "Please enter a valid Google App Password (usually 16 characters)." },
      { status: 400 }
    );
  }

  const encryptedAppPassword = encryptSecret(cleanAppPass);
  const { rawKey, hashedKey, prefix } = await generateApiKey();

  const project = await MailProject.create({
    userId: sessionUser._id,
    name: String(name).trim(),
    gmailUser: String(gmailUser).toLowerCase().trim(),
    encryptedAppPassword,
    defaultFromName: String(defaultFromName || name).trim(),
    defaultReplyTo: defaultReplyTo ? String(defaultReplyTo).trim() : undefined,
    hashedApiKey: hashedKey,
    apiKeyPrefix: prefix,
    isActive: true,
    isRevoked: false,
  });

  const projectObj = project.toObject() as Record<string, any>;
  delete projectObj.encryptedAppPassword;
  delete projectObj.hashedApiKey;

  // rawKey is returned ONCE here and never stored in plain text again
  return NextResponse.json(
    { success: true, data: { ...projectObj, rawApiKey: rawKey } },
    { status: 201 }
  );
}
