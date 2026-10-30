import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { MailProject } from "@/models/MailProject";
import { EmailLog } from "@/models/EmailLog";

export const dynamic = "force-dynamic";

// POST /api/admin/purge-deleted
// Hard-deletes all accounts where deletedAt is older than 30 days.
// Safe to call on a schedule (e.g. daily cron) or manually from admin panel.
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const pendingUsers = await User.collection
    .find({ deletedAt: { $lte: cutoff } })
    .project({ _id: 1, email: 1 })
    .toArray();

  if (pendingUsers.length === 0) {
    return NextResponse.json({ success: true, message: "No accounts pending purge.", purged: [] });
  }

  const ids = pendingUsers.map((u) => u._id);

  await Promise.all([
    MailProject.deleteMany({ userId: { $in: ids } }),
    EmailLog.deleteMany({ userId: { $in: ids } }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);

  return NextResponse.json({
    success: true,
    message: `Permanently deleted ${pendingUsers.length} account(s).`,
    purged: pendingUsers.map((u) => ({ id: String(u._id), email: u.email })),
  });
}

// GET /api/admin/purge-deleted
// Returns accounts currently pending purge (deletedAt set, not yet past 30 days).
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const pending = await User.collection
    .find({ deletedAt: { $exists: true } })
    .project({ _id: 1, email: 1, name: 1, deletedAt: 1 })
    .sort({ deletedAt: 1 })
    .toArray();

  const now = Date.now();
  const cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);

  return NextResponse.json({
    success: true,
    data: pending.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      deletedAt: u.deletedAt,
      purgesAt: new Date(new Date(u.deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000),
      readyToPurge: new Date(u.deletedAt) <= cutoff,
    })),
  });
}
