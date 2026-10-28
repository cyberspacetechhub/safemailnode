import nodemailer from "nodemailer";
import { SystemSettings } from "@/models/SystemSettings";
import { MailProject } from "@/models/MailProject";
import { User } from "@/models/User";
import { decryptSecret } from "./crypto";

export interface SendGmailOptions {
  gmailUser: string;
  appPassword: string;
  fromName: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export async function sendWithGmail(options: SendGmailOptions) {
  const sanitizedPassword = options.appPassword.replace(/\s+/g, "");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: options.gmailUser.trim(),
      pass: sanitizedPassword,
    },
  });

  const safeFromName = (options.fromName || "Notifications").replace(/"/g, "");

  const info = await transporter.sendMail({
    from: `"${safeFromName}" <${options.gmailUser.trim()}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    ...(options.html ? { html: options.html } : {}),
    ...(options.text ? { text: options.text } : {}),
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    ...(options.cc
      ? { cc: Array.isArray(options.cc) ? options.cc.join(", ") : options.cc }
      : {}),
    ...(options.bcc
      ? { bcc: Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc }
      : {}),
  });

  return info;
}

/**
 * Resolves system SMTP credentials (from SystemSettings, env vars, or an Admin's active MailProject)
 * and sends a 6-digit email verification code to a newly registered user.
 */
export async function sendVerificationEmailToUser(
  toEmail: string,
  userName: string,
  code: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    let gmailUser = process.env.SYSTEM_GMAIL_USER?.trim();
    let appPassword = process.env.SYSTEM_GMAIL_APP_PASSWORD?.trim();
    let fromName = "SafeMailNode Security";

    // 1. Check SystemSettings configured in Admin Panel (read directly from collection)
    const settings = await SystemSettings.collection.findOne({ key: "global" });
    if (settings?.systemGmailUser && settings?.systemEncryptedAppPassword) {
      gmailUser = settings.systemGmailUser;
      appPassword = decryptSecret(settings.systemEncryptedAppPassword);
      fromName = settings.systemFromName || "SafeMailNode Security";
    }

    // 2. Fallback: Use any active MailProject owned by an Admin
    if (!gmailUser || !appPassword) {
      const admins = await User.find({ role: "admin", isActive: true }).select("_id");
      if (admins.length > 0) {
        const adminProject = await MailProject.findOne({
          userId: { $in: admins.map((a) => a._id) },
          isActive: true,
        }).sort({ createdAt: 1 });

        if (adminProject) {
          gmailUser = adminProject.gmailUser;
          appPassword = decryptSecret(adminProject.encryptedAppPassword);
          fromName = adminProject.defaultFromName || "SafeMailNode Security";
        }
      }
    }

    if (!gmailUser || !appPassword) {
      console.warn(
        `[SafeMailNode] No System Gmail configured yet to send verification code (${code}) to ${toEmail}`
      );
      return {
        sent: false,
        error: "System mailer not configured by admin yet.",
      };
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff; color: #0f172a;">
        <h2 style="margin-top: 0; color: #0f172a;">Verify your Safe<span style="color:#10b981;">Mail</span>Node email</h2>
        <p style="color: #334155; line-height: 1.6;">
          Hi <strong>${userName}</strong>, use the 6-digit verification code below to activate your account:
        </p>
        <div style="margin: 24px 0; padding: 18px; background: #f8fafc; border: 1px dashed #10b981; border-radius: 10px; text-align: center;">
          <span style="font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #059669; font-family: monospace;">
            ${code}
          </span>
        </div>
        <p style="font-size: 13px; color: #64748b;">
          This verification code expires in 30 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    await sendWithGmail({
      gmailUser,
      appPassword,
      fromName,
      to: toEmail,
      subject: `${code} is your SafeMailNode verification code`,
      html,
    });

    return { sent: true };
  } catch (err: any) {
    console.error("[sendVerificationEmailToUser] Error:", err);
    return { sent: false, error: err?.message || "Failed to send verification email" };
  }
}
