import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { MailProject } from "@/models/MailProject";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  await connectDB();
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));

  const update: Record<string, any> = {};
  if (typeof body.isActive === "boolean") update.isActive = body.isActive;
  if (typeof body.isRevoked === "boolean") update.isRevoked = body.isRevoked;

  const project = await MailProject.findByIdAndUpdate(id, { $set: update }, { new: true })
    .select("-encryptedAppPassword -hashedApiKey");

  if (!project) {
    return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: project });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  await connectDB();
  const { id } = await context.params;

  await MailProject.findByIdAndUpdate(id, {
    $set: { encryptedAppPassword: "", hashedApiKey: "", isRevoked: true },
  });
  const deleted = await MailProject.findByIdAndDelete(id);

  if (!deleted) {
    return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Project deleted." });
}
