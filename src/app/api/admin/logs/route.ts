import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { EmailLog } from "@/models/EmailLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    EmailLog.find().populate("userId", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    EmailLog.countDocuments(),
  ]);

  return NextResponse.json({
    success: true,
    data: logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
