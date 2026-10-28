import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { MailProject } from "@/models/MailProject";
import { encryptSecret, generateApiKey } from "@/lib/crypto";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const project = await MailProject.findOne({ _id: id, userId: user._id });
  if (!project) {
    return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    name,
    gmailUser,
    appPassword,
    defaultFromName,
    defaultReplyTo,
    isActive,
    regenerateKey,
  } = body;

  if (name !== undefined) project.name = String(name).trim();
  if (gmailUser !== undefined) project.gmailUser = String(gmailUser).toLowerCase().trim();
  if (defaultFromName !== undefined) project.defaultFromName = String(defaultFromName).trim();
  if (defaultReplyTo !== undefined) {
    project.defaultReplyTo = defaultReplyTo ? String(defaultReplyTo).trim() : undefined;
  }
  if (typeof isActive === "boolean") project.isActive = isActive;

  if (appPassword && String(appPassword).trim().length > 0) {
    const cleanAppPass = String(appPassword).replace(/\s+/g, "");
    project.encryptedAppPassword = encryptSecret(cleanAppPass);
  }

  if (regenerateKey === true) {
    project.apiKey = generateApiKey();
  }

  await project.save();

  const updated = project.toObject();
  delete (updated as any).encryptedAppPassword;

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await MailProject.findOneAndDelete({ _id: id, userId: user._id });
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Project deleted" });
}
