import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MailProject } from "@/models/MailProject";
import { User } from "@/models/User";
import { EmailLog } from "@/models/EmailLog";
import { decryptSecret, verifyApiKey } from "@/lib/crypto";
import { sendWithGmail } from "@/lib/mailer";
import { enforceRateLimit } from "@/lib/rateLimit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Extract API Key from x-api-key or Authorization: Bearer <key>
    let apiKey = req.headers.get("x-api-key")?.trim();
    if (!apiKey) {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        apiKey = authHeader.slice(7).trim();
      }
    }

    // Rate limit per API key (or IP if missing) — 60 requests / minute
    const rateLimitRes = await enforceRateLimit(req, {
      namespace: "api:send-email",
      limit: 60,
      windowSeconds: 60,
      identifier: apiKey,
    });
    if (rateLimitRes) return rateLimitRes;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing API key. Pass your project key in the 'x-api-key' header.",
        },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectDB();

    // 2. Look up project by API key prefix, then verify full key against stored hash
    const prefix = apiKey.slice(0, 20) + "...";
    const candidates = await MailProject.find({ apiKeyPrefix: prefix });

    let project = null;
    for (const candidate of candidates) {
      const match = await verifyApiKey(apiKey, candidate.hashedApiKey);
      if (match) {
        project = candidate;
        break;
      }
    }

    if (!project) {
      return NextResponse.json(
        { success: false, message: "Invalid API key." },
        { status: 401, headers: corsHeaders }
      );
    }

    if (project.isRevoked) {
      return NextResponse.json(
        { success: false, message: "This API key has been revoked." },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!project.isActive) {
      return NextResponse.json(
        { success: false, message: "This project configuration is currently disabled." },
        { status: 403, headers: corsHeaders }
      );
    }

    // 3. Verify project owner account states (Active, Locked, Frozen, Email Verified, Quota)
    const user = await User.collection.findOne({ _id: project.userId });
    if (!user || user.isActive === false || user.deletedAt) {
      return NextResponse.json(
        { success: false, message: "Account suspended or deactivated." },
        { status: 403, headers: corsHeaders }
      );
    }

    if (user.isLocked === true) {
      return NextResponse.json(
        {
          success: false,
          message: user.lockReason || "Account is locked. Contact administrator.",
        },
        { status: 423, headers: corsHeaders }
      );
    }

    if (user.isFrozen === true) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is currently frozen by an administrator. Outgoing emails are paused.",
        },
        { status: 403, headers: corsHeaders }
      );
    }

    if (user.isEmailVerified === false) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your account email address before sending emails.",
        },
        { status: 403, headers: corsHeaders }
      );
    }

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const sentToday = await EmailLog.countDocuments({
      userId: user._id,
      status: "sent",
      createdAt: { $gte: startOfDay },
    });

    const effectiveDailyQuota = Number(user.dailyQuota ?? 100);
    if (sentToday >= effectiveDailyQuota) {
      return NextResponse.json(
        {
          success: false,
          message: `Daily email limit reached (${effectiveDailyQuota}/day). Contact admin to increase your daily limit.`,
        },
        { status: 429, headers: corsHeaders }
      );
    }

    // 4. Parse request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { to, subject, html, text, fromName, replyTo, cc, bcc } = body;

    const recipientList = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (!recipientList.length || !subject || (!html && !text)) {
      return NextResponse.json(
        {
          success: false,
          message: "Fields 'to', 'subject', and either 'html' or 'text' are required.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const effectiveFromName = fromName || project.defaultFromName || "Notifications";
    const effectiveReplyTo = replyTo || project.defaultReplyTo;
    const recipientString = recipientList.join(", ");

    // 5. Decrypt Gmail App Password & send via Nodemailer
    if (!project.encryptedAppPassword || !project.gmailUser) {
      return NextResponse.json(
        {
          success: false,
          message: "This project is missing Gmail credentials. Please edit the project and re-enter your Gmail address and App Password.",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    let appPassword = "";
    try {
      appPassword = decryptSecret(project.encryptedAppPassword);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to decrypt stored Gmail App Password. Please edit the project and re-save your Gmail settings.",
        },
        { status: 500, headers: corsHeaders }
      );
    }

    try {
      const info = await sendWithGmail({
        gmailUser: project.gmailUser,
        appPassword,
        fromName: effectiveFromName,
        to: recipientList.length === 1 ? recipientList[0] : recipientList,
        subject,
        html,
        text,
        replyTo: effectiveReplyTo,
        cc,
        bcc,
      });

      project.totalSent += 1;
      project.lastUsedAt = new Date();
      await project.save();

      await EmailLog.create({
        userId: user._id,
        projectId: project._id,
        projectName: project.name,
        gmailUser: project.gmailUser,
        fromName: effectiveFromName,
        to: recipientString,
        subject,
        status: "sent",
        messageId: info.messageId,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Email sent successfully",
          data: {
            messageId: info.messageId,
            project: project.name,
            from: `"${effectiveFromName}" <${project.gmailUser}>`,
          },
        },
        { status: 200, headers: corsHeaders }
      );
    } catch (sendError: any) {
      project.totalFailed += 1;
      project.lastUsedAt = new Date();
      await project.save();

      await EmailLog.create({
        userId: user._id,
        projectId: project._id,
        projectName: project.name,
        gmailUser: project.gmailUser,
        fromName: effectiveFromName,
        to: recipientString,
        subject,
        status: "failed",
        errorMessage: sendError?.message || "SMTP error",
      });

      return NextResponse.json(
        {
          success: false,
          message: sendError?.message || "Failed to send email via Gmail SMTP",
        },
        { status: 502, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("[POST /api/send-email] Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
