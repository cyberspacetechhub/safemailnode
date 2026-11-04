import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AuditLog } from "@/models/AuditLog";
import { connectDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find({ userId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments({ userId: user._id }),
  ]);

  return NextResponse.json({
    success: true,
    data: logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
