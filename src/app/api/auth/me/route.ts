import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/models/User";
import { EmailLog } from "@/models/EmailLog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionUser = await getCurrentUser(req);
  if (!sessionUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // Always read raw document directly from MongoDB collection to bypass any schema cache
  let rawUser = await User.collection.findOne({ _id: sessionUser._id });
  if (!rawUser) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // Migrate any legacy user created when default was 1 project & allowMultipleProjects: false
  if (
    rawUser.role === "user" &&
    rawUser.allowMultipleProjects === false &&
    rawUser.maxProjects === 1 &&
    !rawUser.adminAdjustedLimits
  ) {
    await User.collection.updateOne(
      { _id: sessionUser._id },
      {
        $set: {
          maxProjects: 2,
          allowMultipleProjects: true,
          dailyQuota: rawUser.dailyQuota ?? 100,
          adminAdjustedLimits: true,
        },
      }
    );
    rawUser = (await User.collection.findOne({ _id: sessionUser._id })) || rawUser;
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const sentToday = await EmailLog.countDocuments({
    userId: sessionUser._id,
    status: "sent",
    createdAt: { $gte: startOfDay },
  });

  const maxProjects = Number(rawUser.maxProjects ?? 2);
  const dailyQuota = Number(rawUser.dailyQuota ?? 100);

  return NextResponse.json(
    {
      success: true,
      data: {
        id: rawUser._id,
        name: rawUser.name,
        email: rawUser.email,
        role: rawUser.role,
        plan: rawUser.plan || "free",
        isActive: rawUser.isActive !== false,
        isFrozen: Boolean(rawUser.isFrozen),
        isLocked: Boolean(rawUser.isLocked),
        isEmailVerified: Boolean(rawUser.isEmailVerified),
        allowMultipleProjects: maxProjects > 1,
        maxProjects,
        dailyQuota,
        sentToday,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
