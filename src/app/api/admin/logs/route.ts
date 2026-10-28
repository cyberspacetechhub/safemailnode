import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { EmailLog } from "@/models/EmailLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  const logs = await EmailLog.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(150);

  return NextResponse.json({
    success: true,
    data: logs,
  });
}
