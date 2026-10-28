import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { getCurrentAdmin } from "@/lib/auth";
import { User } from "@/models/User";
import { MailProject } from "@/models/MailProject";
import { EmailLog } from "@/models/EmailLog";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "Invalid user ID" }, { status: 400 });
  }

  const objectId = new mongoose.Types.ObjectId(id);
  const targetUser = await User.collection.findOne({ _id: objectId });
  if (!targetUser) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    allowMultipleProjects,
    maxProjects,
    dailyQuota,
    plan,
    isActive,
    isFrozen,
    isLocked,
    lockReason,
    isEmailVerified,
    role,
    newPassword,
  } = body;

  const $set: Record<string, any> = {
    updatedAt: new Date(),
    adminAdjustedLimits: true,
  };
  const $unset: Record<string, any> = {};

  if (typeof allowMultipleProjects === "boolean") {
    $set.allowMultipleProjects = allowMultipleProjects;
    if (!allowMultipleProjects && maxProjects === undefined) {
      $set.maxProjects = 1;
    } else if (
      allowMultipleProjects &&
      (targetUser.maxProjects ?? 1) < 2 &&
      maxProjects === undefined
    ) {
      $set.maxProjects = 2;
    }
  }

  if (maxProjects !== undefined) {
    const parsedMax = Number(maxProjects);
    if (!isNaN(parsedMax) && parsedMax >= 1) {
      $set.maxProjects = parsedMax;
      $set.allowMultipleProjects = parsedMax > 1;
    }
  }

  if (dailyQuota !== undefined) {
    const parsedQuota = Number(dailyQuota);
    if (!isNaN(parsedQuota) && parsedQuota >= 0) {
      $set.dailyQuota = parsedQuota;
    }
  }

  if (plan === "free" || plan === "pro" || plan === "enterprise") {
    $set.plan = plan;
  }

  if (typeof isActive === "boolean") {
    if (String(targetUser._id) === String(admin._id) && !isActive) {
      return NextResponse.json(
        { success: false, message: "You cannot suspend your own admin account." },
        { status: 400 }
      );
    }
    $set.isActive = isActive;
  }

  if (typeof isFrozen === "boolean") {
    $set.isFrozen = isFrozen;
  }

  if (typeof isLocked === "boolean") {
    if (String(targetUser._id) === String(admin._id) && isLocked) {
      return NextResponse.json(
        { success: false, message: "You cannot lock your own admin account." },
        { status: 400 }
      );
    }
    $set.isLocked = isLocked;
    if (!isLocked) {
      $set.failedLoginAttempts = 0;
      $unset.lockReason = "";
    } else {
      $set.lockReason = lockReason
        ? String(lockReason).trim()
        : "Account locked by administrator.";
    }
  }

  if (typeof isEmailVerified === "boolean") {
    $set.isEmailVerified = isEmailVerified;
    if (isEmailVerified) {
      $unset.emailVerificationCode = "";
      $unset.emailVerificationExpires = "";
    }
  }

  if (role === "user" || role === "admin") {
    if (String(targetUser._id) === String(admin._id) && role !== "admin") {
      return NextResponse.json(
        { success: false, message: "You cannot demote your own admin role." },
        { status: 400 }
      );
    }
    $set.role = role;
  }

  if (newPassword && String(newPassword).trim().length >= 6) {
    $set.passwordHash = await bcrypt.hash(String(newPassword).trim(), 10);
    $set.failedLoginAttempts = 0;
    $set.isLocked = false;
    $unset.lockReason = "";
  }

  const updateOp: Record<string, any> = { $set };
  if (Object.keys($unset).length > 0) {
    updateOp.$unset = $unset;
  }

  await User.collection.updateOne({ _id: objectId }, updateOp);

  const updated = await User.collection.findOne(
    { _id: objectId },
    { projection: { passwordHash: 0 } }
  );

  return NextResponse.json({
    success: true,
    data: updated,
  });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin(req);
  if (!admin) {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;
  if (String(admin._id) === String(id)) {
    return NextResponse.json(
      { success: false, message: "You cannot delete your own administrator account." },
      { status: 400 }
    );
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  await Promise.all([
    MailProject.deleteMany({ userId: targetUser._id }),
    EmailLog.deleteMany({ userId: targetUser._id }),
    User.findByIdAndDelete(targetUser._id),
  ]);

  return NextResponse.json({
    success: true,
    message: `Deleted user ${targetUser.email} along with all their projects and logs.`,
  });
}
