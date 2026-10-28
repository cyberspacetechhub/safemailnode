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

  const filter: Record<string, any> = { userId: user._id };
  if (projectId) filter.projectId = projectId;
  if (status === "sent" || status === "failed") filter.status = status;

  const logs = await EmailLog.find(filter).sort({ createdAt: -1 }).limit(100);

  return NextResponse.json({
    success: true,
    data: logs,
  });
}
