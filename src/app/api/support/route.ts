import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SystemSettings } from "@/models/SystemSettings";
import { getCurrentAdmin } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
  key: "global",
  isSupportEnabled: true,
  supportTitle: "Support SafeMailNode Development",
  supportSubtitle:
    "SafeMailNode is currently free to use while we grow. If this service saves you time and money, consider supporting our infrastructure and development!",
  supportMessage:
    "Every contribution goes directly toward server costs, maintenance, and keeping the Gmail SMTP gateway fast and reliable for developers.",
  contactEmail: "",
  bankAccounts: [],
  cryptoWallets: [],
  paymentLinks: [],
  systemGmailUser: "",
  systemFromName: "SafeMailNode Security",
};

export async function GET() {
  try {
    await connectDB();
    let doc = await SystemSettings.collection.findOne({ key: "global" });

    if (!doc) {
      await SystemSettings.collection.insertOne({
        ...DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      doc = await SystemSettings.collection.findOne({ key: "global" });
    }

    const hasSystemPassword = Boolean(doc?.systemEncryptedAppPassword);
    const sanitized: Record<string, any> = {
      ...DEFAULT_SETTINGS,
      ...doc,
      hasSystemPassword,
    };
    delete sanitized.systemEncryptedAppPassword;

    return NextResponse.json(
      {
        success: true,
        data: sanitized,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[GET /api/support] Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load support settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin(req);
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator session required. Please sign in at /admin/login.",
        },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json().catch(() => ({}));
    const {
      isSupportEnabled,
      supportTitle,
      supportSubtitle,
      supportMessage,
      contactEmail,
      bankAccounts,
      cryptoWallets,
      paymentLinks,
      systemGmailUser,
      systemAppPassword,
      systemFromName,
    } = body;

    const $set: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (typeof isSupportEnabled === "boolean") $set.isSupportEnabled = isSupportEnabled;
    if (supportTitle !== undefined) $set.supportTitle = String(supportTitle).trim();
    if (supportSubtitle !== undefined) $set.supportSubtitle = String(supportSubtitle).trim();
    if (supportMessage !== undefined) $set.supportMessage = String(supportMessage).trim();
    if (contactEmail !== undefined) $set.contactEmail = String(contactEmail).trim();

    if (Array.isArray(bankAccounts)) {
      // Keep any row where at least one field was filled in by the admin
      $set.bankAccounts = bankAccounts
        .map((b: any) => ({
          bankName: String(b.bankName || "").trim(),
          accountName: String(b.accountName || "").trim(),
          accountNumber: String(b.accountNumber || "").trim(),
          currency: String(b.currency || "NGN").trim(),
          routingOrSwift: String(b.routingOrSwift || "").trim(),
          note: String(b.note || "").trim(),
        }))
        .filter((b: any) => b.bankName || b.accountName || b.accountNumber);
    }

    if (Array.isArray(cryptoWallets)) {
      $set.cryptoWallets = cryptoWallets
        .map((w: any) => ({
          coin: String(w.coin || "").trim(),
          network: String(w.network || "").trim(),
          walletAddress: String(w.walletAddress || "").trim(),
          note: String(w.note || "").trim(),
        }))
        .filter((w: any) => w.coin || w.walletAddress);
    }

    if (Array.isArray(paymentLinks)) {
      $set.paymentLinks = paymentLinks
        .map((l: any) => ({
          label: String(l.label || "").trim(),
          url: String(l.url || "").trim(),
          description: String(l.description || "").trim(),
        }))
        .filter((l: any) => l.label || l.url);
    }

    if (systemGmailUser !== undefined) {
      $set.systemGmailUser = String(systemGmailUser).toLowerCase().trim();
    }
    if (systemFromName !== undefined) {
      $set.systemFromName = String(systemFromName).trim();
    }
    if (systemAppPassword && String(systemAppPassword).trim().length > 0) {
      const cleanPass = String(systemAppPassword).replace(/\s+/g, "");
      $set.systemEncryptedAppPassword = encryptSecret(cleanPass);
    }

    await SystemSettings.collection.updateOne(
      { key: "global" },
      {
        $set,
        $setOnInsert: { key: "global", createdAt: new Date() },
      },
      { upsert: true }
    );

    const updated = await SystemSettings.collection.findOne({ key: "global" });
    const hasSystemPassword = Boolean(updated?.systemEncryptedAppPassword);
    const sanitized: Record<string, any> = {
      ...DEFAULT_SETTINGS,
      ...updated,
      hasSystemPassword,
    };
    delete sanitized.systemEncryptedAppPassword;

    return NextResponse.json({
      success: true,
      message: "Support Our Project & System Mailer settings saved!",
      data: sanitized,
    });
  } catch (error: any) {
    console.error("[PUT /api/support] Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to save support settings" },
      { status: 500 }
    );
  }
}
