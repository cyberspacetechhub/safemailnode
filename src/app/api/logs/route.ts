import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { EmailLog } from "@/models/EmailLog";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = { userId: user._id };
  if (projectId) filter.projectId = projectId;
  if (status === "sent" || status === "failed") filter.status = status;

  const [logs, total] = await Promise.all([
    EmailLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    EmailLog.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    data: logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
