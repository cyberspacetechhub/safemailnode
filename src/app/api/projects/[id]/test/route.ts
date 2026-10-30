import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { MailProject } from "@/models/MailProject";
import { EmailLog } from "@/models/EmailLog";
import { decryptSecret } from "@/lib/crypto";
import { sendWithGmail } from "@/lib/mailer";
import { enforceRateLimit } from "@/lib/rateLimit";
import { connectDB } from "@/lib/db";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await enforceRateLimit(req, {
    namespace: "projects:test-email",
    limit: 5,
    windowSeconds: 5 * 60,
  });
  if (rateLimitRes) return rateLimitRes;

  await connectDB();
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!user.isEmailVerified) {
    return NextResponse.json(
      { success: false, message: "Please verify your email address first." },
      { status: 403 }
    );
  }

  if (user.isFrozen) {
    return NextResponse.json(
      {
        success: false,
        message: "Your account is currently frozen by an administrator. Email sending is paused.",
      },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const project = await MailProject.findOne({ _id: id, userId: user._id });
  if (!project) {
    return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const recipient = (body.to || user.email).trim();

  const subject = `[Test] ${project.name} — Gmail SMTP Verification`;
  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="margin-top: 0; color: #0f172a;">Gmail SMTP Connected Successfully!</h2>
      <p style="color: #334155; line-height: 1.6;">
        Your project <strong>${project.name}</strong> is properly configured to send emails via Nodemailer &amp; Gmail.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Sender Name:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${project.defaultFromName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Gmail Account:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${project.gmailUser}</td>
        </tr>
      </table>
    </div>
  `;

  try {
    if (!project.encryptedAppPassword) {
      return NextResponse.json(
        { success: false, message: "No App Password saved for this project. Please edit the project and re-enter your Gmail App Password." },
        { status: 400 }
      );
    }
    const appPassword = decryptSecret(project.encryptedAppPassword);

    const info = await sendWithGmail({
      gmailUser: project.gmailUser,
      appPassword,
      fromName: project.defaultFromName,
      to: recipient,
      subject,
      html,
      replyTo: project.defaultReplyTo,
    });

    project.totalSent += 1;
    project.lastUsedAt = new Date();
    await project.save();

    await EmailLog.create({
      userId: user._id,
      projectId: project._id,
      projectName: project.name,
      gmailUser: project.gmailUser,
      fromName: project.defaultFromName,
      to: recipient,
      subject,
      status: "sent",
      messageId: info.messageId,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${recipient}`,
      data: { messageId: info.messageId },
    });
  } catch (err: any) {
    project.totalFailed += 1;
    project.lastUsedAt = new Date();
    await project.save();

    await EmailLog.create({
      userId: user._id,
      projectId: project._id,
      projectName: project.name,
      gmailUser: project.gmailUser,
      fromName: project.defaultFromName,
      to: recipient,
      subject,
      status: "failed",
      errorMessage: err?.message || "SMTP verification failed",
    });

    return NextResponse.json(
      {
        success: false,
        message:
          err?.message ||
          "Failed to send test email. Double-check your Gmail address and 16-character App Password.",
      },
      { status: 502 }
    );
  }
}
