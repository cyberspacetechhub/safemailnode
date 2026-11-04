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

export async function sendWelcomeEmail(
  toEmail: string,
  userName: string
): Promise<void> {
  try {
    let gmailUser = process.env.SYSTEM_GMAIL_USER?.trim();
    let appPassword = process.env.SYSTEM_GMAIL_APP_PASSWORD?.trim();
    let fromName = "SafeMailNode";

    const settings = await SystemSettings.collection.findOne({ key: "global" });
    if (settings?.systemGmailUser && settings?.systemEncryptedAppPassword) {
      gmailUser = settings.systemGmailUser;
      appPassword = decryptSecret(settings.systemEncryptedAppPassword);
      fromName = settings.systemFromName || "SafeMailNode";
    }

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
          fromName = adminProject.defaultFromName || "SafeMailNode";
        }
      }
    }

    if (!gmailUser || !appPassword) return;

    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff; color: #0f172a;">
        <h2 style="margin-top: 0;">Welcome to Safe<span style="color:#10b981;">Mail</span>Node 🎉</h2>
        <p style="color: #334155; line-height: 1.6;">Hi <strong>${userName}</strong>, your account is ready.</p>
        <p style="color: #334155; line-height: 1.6;">Here's how to get started:</p>
        <ol style="color: #334155; line-height: 2;">
          <li>Verify your email address with the code we just sent you.</li>
          <li>Go to your dashboard and add a Gmail configuration.</li>
          <li>Copy your API key and drop it into your project's <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">.env</code> file.</li>
          <li>Call <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">POST /api/send-email</code> with your <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">x-api-key</code> header.</li>
        </ol>
        <p style="font-size: 13px; color: #64748b;">Need help? Check out the <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/docs" style="color:#10b981;">documentation</a>.</p>
      </div>
    `;

    await sendWithGmail({ gmailUser, appPassword, fromName, to: toEmail, subject: `Welcome to SafeMailNode, ${userName}!`, html });
  } catch (err) {
    console.error("[sendWelcomeEmail] Error:", err);
  }
}

export async function sendProjectNotificationEmail(
  toEmail: string,
  userName: string,
  action: "created" | "updated",
  projectName: string,
  gmailUser: string
): Promise<void> {
  try {
    let sysGmailUser = process.env.SYSTEM_GMAIL_USER?.trim();
    let appPassword = process.env.SYSTEM_GMAIL_APP_PASSWORD?.trim();
    let fromName = "SafeMailNode";

    const settings = await SystemSettings.collection.findOne({ key: "global" });
    if (settings?.systemGmailUser && settings?.systemEncryptedAppPassword) {
      sysGmailUser = settings.systemGmailUser;
      appPassword = decryptSecret(settings.systemEncryptedAppPassword);
      fromName = settings.systemFromName || "SafeMailNode";
    }

    if (!sysGmailUser || !appPassword) {
      const admins = await User.find({ role: "admin", isActive: true }).select("_id");
      if (admins.length > 0) {
        const adminProject = await MailProject.findOne({
          userId: { $in: admins.map((a) => a._id) },
          isActive: true,
        }).sort({ createdAt: 1 });
        if (adminProject) {
          sysGmailUser = adminProject.gmailUser;
          appPassword = decryptSecret(adminProject.encryptedAppPassword);
          fromName = adminProject.defaultFromName || "SafeMailNode";
        }
      }
    }

    if (!sysGmailUser || !appPassword) return;

    const verb = action === "created" ? "created" : "updated";
    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff; color: #0f172a;">
        <h2 style="margin-top: 0;">Gmail configuration ${verb}</h2>
        <p style="color: #334155; line-height: 1.6;">Hi <strong>${userName}</strong>, your project <strong>${projectName}</strong> was successfully ${verb}.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#64748b;">Project</td><td style="padding:8px 0;font-weight:600;">${projectName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Gmail</td><td style="padding:8px 0;font-family:monospace;">${gmailUser}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Action</td><td style="padding:8px 0;text-transform:capitalize;">${verb}</td></tr>
        </table>
        <p style="font-size: 13px; color: #64748b;">If you did not make this change, please <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard" style="color:#10b981;">review your dashboard</a> immediately.</p>
      </div>
    `;

    await sendWithGmail({ gmailUser: sysGmailUser, appPassword, fromName, to: toEmail, subject: `Your SafeMailNode project "${projectName}" was ${verb}`, html });
  } catch (err) {
    console.error("[sendProjectNotificationEmail] Error:", err);
  }
}

export async function sendLoginAlertEmail(
  toEmail: string,
  userName: string,
  ip: string,
  userAgent: string,
  time: string
): Promise<void> {
  try {
    let gmailUser = process.env.SYSTEM_GMAIL_USER?.trim();
    let appPassword = process.env.SYSTEM_GMAIL_APP_PASSWORD?.trim();
    let fromName = "SafeMailNode Security";

    const settings = await SystemSettings.collection.findOne({ key: "global" });
    if (settings?.systemGmailUser && settings?.systemEncryptedAppPassword) {
      gmailUser = settings.systemGmailUser;
      appPassword = decryptSecret(settings.systemEncryptedAppPassword);
      fromName = settings.systemFromName || "SafeMailNode Security";
    }
    if (!gmailUser || !appPassword) {
      const admins = await User.find({ role: "admin", isActive: true }).select("_id");
      if (admins.length > 0) {
        const adminProject = await MailProject.findOne({ userId: { $in: admins.map((a) => a._id) }, isActive: true }).sort({ createdAt: 1 });
        if (adminProject) { gmailUser = adminProject.gmailUser; appPassword = decryptSecret(adminProject.encryptedAppPassword); fromName = adminProject.defaultFromName || "SafeMailNode Security"; }
      }
    }
    if (!gmailUser || !appPassword) return;

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;color:#0f172a;">
        <h2 style="margin-top:0;color:#0f172a;">New sign-in to your account</h2>
        <p style="color:#334155;line-height:1.6;">Hi <strong>${userName}</strong>, a new sign-in was detected on your SafeMailNode account.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;background:#f8fafc;border-radius:8px;padding:12px;">
          <tr><td style="padding:6px 12px;color:#64748b;">Time</td><td style="padding:6px 12px;font-weight:600;">${time}</td></tr>
          <tr><td style="padding:6px 12px;color:#64748b;">IP Address</td><td style="padding:6px 12px;font-family:monospace;">${ip}</td></tr>
          <tr><td style="padding:6px 12px;color:#64748b;">Device</td><td style="padding:6px 12px;">${userAgent}</td></tr>
        </table>
        <p style="font-size:13px;color:#64748b;">If this was you, no action is needed. If you don't recognise this sign-in, <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/forgot-password" style="color:#ef4444;">reset your password immediately</a>.</p>
      </div>`;

    await sendWithGmail({ gmailUser, appPassword, fromName, to: toEmail, subject: "New sign-in detected on your SafeMailNode account", html });
  } catch (err) { console.error("[sendLoginAlertEmail]", err); }
}

export async function sendEmailChangedNotification(
  toEmail: string,
  userName: string,
  oldEmail: string
): Promise<void> {
  try {
    let gmailUser = process.env.SYSTEM_GMAIL_USER?.trim();
    let appPassword = process.env.SYSTEM_GMAIL_APP_PASSWORD?.trim();
    let fromName = "SafeMailNode Security";

    const settings = await SystemSettings.collection.findOne({ key: "global" });
    if (settings?.systemGmailUser && settings?.systemEncryptedAppPassword) {
      gmailUser = settings.systemGmailUser;
      appPassword = decryptSecret(settings.systemEncryptedAppPassword);
      fromName = settings.systemFromName || "SafeMailNode Security";
    }
    if (!gmailUser || !appPassword) {
      const admins = await User.find({ role: "admin", isActive: true }).select("_id");
      if (admins.length > 0) {
        const adminProject = await MailProject.findOne({ userId: { $in: admins.map((a) => a._id) }, isActive: true }).sort({ createdAt: 1 });
        if (adminProject) { gmailUser = adminProject.gmailUser; appPassword = decryptSecret(adminProject.encryptedAppPassword); fromName = adminProject.defaultFromName || "SafeMailNode Security"; }
      }
    }
    if (!gmailUser || !appPassword) return;

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;color:#0f172a;">
        <h2 style="margin-top:0;color:#0f172a;">Email address changed</h2>
        <p style="color:#334155;line-height:1.6;">Hi <strong>${userName}</strong>, your SafeMailNode account email was changed.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#64748b;">Previous email</td><td style="padding:8px 0;font-family:monospace;">${oldEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">New email</td><td style="padding:8px 0;font-family:monospace;">${toEmail}</td></tr>
        </table>
        <p style="font-size:13px;color:#64748b;">If you did not make this change, contact support immediately.</p>
      </div>`;

    await sendWithGmail({ gmailUser, appPassword, fromName, to: toEmail, subject: "Your SafeMailNode email address was changed", html });
  } catch (err) { console.error("[sendEmailChangedNotification]", err); }
}

export async function sendPasswordChangedNotification(
  toEmail: string,
  userName: string
): Promise<void> {
  try {
    let gmailUser = process.env.SYSTEM_GMAIL_USER?.trim();
    let appPassword = process.env.SYSTEM_GMAIL_APP_PASSWORD?.trim();
    let fromName = "SafeMailNode Security";

    const settings = await SystemSettings.collection.findOne({ key: "global" });
    if (settings?.systemGmailUser && settings?.systemEncryptedAppPassword) {
      gmailUser = settings.systemGmailUser;
      appPassword = decryptSecret(settings.systemEncryptedAppPassword);
      fromName = settings.systemFromName || "SafeMailNode Security";
    }
    if (!gmailUser || !appPassword) {
      const admins = await User.find({ role: "admin", isActive: true }).select("_id");
      if (admins.length > 0) {
        const adminProject = await MailProject.findOne({ userId: { $in: admins.map((a) => a._id) }, isActive: true }).sort({ createdAt: 1 });
        if (adminProject) { gmailUser = adminProject.gmailUser; appPassword = decryptSecret(adminProject.encryptedAppPassword); fromName = adminProject.defaultFromName || "SafeMailNode Security"; }
      }
    }
    if (!gmailUser || !appPassword) return;

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:14px;background:#ffffff;color:#0f172a;">
        <h2 style="margin-top:0;color:#0f172a;">Password changed</h2>
        <p style="color:#334155;line-height:1.6;">Hi <strong>${userName}</strong>, your SafeMailNode account password was just changed.</p>
        <p style="font-size:13px;color:#64748b;">If you did not make this change, use <a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/forgot-password" style="color:#10b981;">Forgot Password</a> to secure your account immediately.</p>
      </div>`;

    await sendWithGmail({ gmailUser, appPassword, fromName, to: toEmail, subject: "Your SafeMailNode password was changed", html });
  } catch (err) { console.error("[sendPasswordChangedNotification]", err); }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  resetUrl: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    let gmailUser = process.env.SYSTEM_GMAIL_USER?.trim();
    let appPassword = process.env.SYSTEM_GMAIL_APP_PASSWORD?.trim();
    let fromName = "SafeMailNode Security";

    const settings = await SystemSettings.collection.findOne({ key: "global" });
    if (settings?.systemGmailUser && settings?.systemEncryptedAppPassword) {
      gmailUser = settings.systemGmailUser;
      appPassword = decryptSecret(settings.systemEncryptedAppPassword);
      fromName = settings.systemFromName || "SafeMailNode Security";
    }

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
      return { sent: false, error: "System mailer not configured." };
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff; color: #0f172a;">
        <h2 style="margin-top: 0; color: #0f172a;">Reset your Safe<span style="color:#10b981;">Mail</span>Node password</h2>
        <p style="color: #334155; line-height: 1.6;">Hi <strong>${userName}</strong>, click the button below to reset your password. This link expires in 30 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
        <p style="font-size:13px;color:#64748b;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    await sendWithGmail({ gmailUser, appPassword, fromName, to: toEmail, subject: "Reset your SafeMailNode password", html });
    return { sent: true };
  } catch (err: any) {
    console.error("[sendPasswordResetEmail] Error:", err);
    return { sent: false, error: err?.message || "Failed to send reset email" };
  }
}
