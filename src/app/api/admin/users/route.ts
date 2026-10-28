import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { User } from "@/models/User";
import { MailProject } from "@/models/MailProject";
import { EmailLog } from "@/models/EmailLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  // Upgrade any legacy user still stuck on the old 1-project default
  await User.collection.updateMany(
    {
      role: "user",
      allowMultipleProjects: false,
      maxProjects: 1,
      adminAdjustedLimits: { $ne: true },
    },
    {
      $set: {
        maxProjects: 2,
        allowMultipleProjects: true,
        adminAdjustedLimits: true,
      },
    }
  );

  const rawUsers = await User.collection
    .find({})
    .project({ passwordHash: 0 })
    .sort({ createdAt: -1 })
    .toArray();

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const enrichedUsers = await Promise.all(
    rawUsers.map(async (u) => {
      const [projectCount, sentToday, totalSent] = await Promise.all([
        MailProject.countDocuments({ userId: u._id }),
        EmailLog.countDocuments({
          userId: u._id,
          status: "sent",
          createdAt: { $gte: startOfDay },
        }),
        EmailLog.countDocuments({ userId: u._id, status: "sent" }),
      ]);

      const maxProjects = Number(u.maxProjects ?? 2);
      const dailyQuota = Number(u.dailyQuota ?? 100);

      return {
        ...u,
        maxProjects,
        dailyQuota,
        allowMultipleProjects: maxProjects > 1,
        isActive: u.isActive !== false,
        isFrozen: Boolean(u.isFrozen),
        isLocked: Boolean(u.isLocked),
        isEmailVerified: Boolean(u.isEmailVerified),
        projectCount,
        sentToday,
        totalSent,
      };
    })
  );

  return NextResponse.json(
    {
      success: true,
      data: enrichedUsers,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
