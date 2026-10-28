import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { MailProject } from "@/models/MailProject";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  const projects = await MailProject.find()
    .select("-encryptedAppPassword")
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(200);

  return NextResponse.json({
    success: true,
    data: projects,
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  const { projectId, isActive } = await req.json();
  const project = await MailProject.findByIdAndUpdate(
    projectId,
    { isActive: Boolean(isActive) },
    { new: true }
  ).select("-encryptedAppPassword");

  if (!project) {
    return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: project });
}

export async function DELETE(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ success: false, message: "projectId required" }, { status: 400 });
  }

  await MailProject.findByIdAndDelete(projectId);
  return NextResponse.json({ success: true, message: "Project deleted by admin." });
}
