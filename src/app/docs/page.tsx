"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Terminal,
  Copy,
  Check,
  Key,
  ShieldCheck,
  Layers,
  Code2,
  FileCode2,
  Send,
  AlertTriangle,
  ArrowRight,
  Heart,
  CheckCircle2,
  Server,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import Footer from "@/components/Footer";

const ENV_SNIPPET = `# Core Email Sender Identity
EMAIL_FROM="Acme Cloud <notifications@acmecorp.com>"
EMAIL_FROM_NAME="Acme Cloud"
EMAIL_REPLY_TO="support@acmecorp.com"

# SafeMailNode Gateway Credentials
MAIL_SERVICE_URL=https://safemailnode.vercel.app
MAIL_SERVICE_API_KEY=ms_live_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c`;

const TS_SERVICE_SNIPPET = `// src/services/email.service.ts
function extractSenderName(rawFrom?: string): string {
  if (process.env.EMAIL_FROM_NAME) return process.env.EMAIL_FROM_NAME.trim();
  if (!rawFrom) return "Acme Cloud";
  const match = rawFrom.match(/^([^<]+)</);
  return match ? match[1].trim() : rawFrom.trim();
}

export interface SendEmailOptions {
  text?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string,
  options?: SendEmailOptions
) => {
  const mailServiceUrl = (
    process.env.MAIL_SERVICE_URL || "https://safemailnode.vercel.app"
  ).replace(/\\/+$/, "");

  const mailServiceApiKey = process.env.MAIL_SERVICE_API_KEY?.trim();

  if (!mailServiceApiKey) {
    throw new Error("MAIL_SERVICE_API_KEY is not configured in environment variables.");
  }

  const response = await fetch(\`\${mailServiceUrl}/api/send-email\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": mailServiceApiKey,
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      ...(options?.text ? { text: options.text } : {}),
      fromName: options?.fromName || extractSenderName(process.env.EMAIL_FROM),
      ...(options?.replyTo || process.env.EMAIL_REPLY_TO
        ? { replyTo: options?.replyTo || process.env.EMAIL_REPLY_TO }
        : {}),
      ...(options?.cc ? { cc: options.cc } : {}),
      ...(options?.bcc ? { bcc: options.bcc } : {}),
    }),
  });

  const result = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    data?: {
      messageId: string;
      project: string;
      from: string;
    };
  };

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || \`SafeMailNode request failed with status \${response.status}\`
    );
  }

  return result.data;
};`;

const CJS_SERVICE_SNIPPET = `// services/emailService.js (CommonJS / Express)
const FROM = process.env.EMAIL_FROM || "Acme Cloud <notifications@acmecorp.com>";

const extractSenderName = (rawFrom) => {
  if (process.env.EMAIL_FROM_NAME) return process.env.EMAIL_FROM_NAME.trim();
  if (!rawFrom) return "Acme Cloud";
  const match = rawFrom.match(/^([^<]+)</);
  return match ? match[1].trim() : rawFrom.trim();
};

const send = async ({ to, subject, html, text, fromName, replyTo }) => {
  const mailServiceUrl = (
    process.env.MAIL_SERVICE_URL || "https://safemailnode.vercel.app"
  ).replace(/\\/+$/, "");
  const mailServiceApiKey = (process.env.MAIL_SERVICE_API_KEY || "").trim();

  if (!mailServiceApiKey) {
    throw new Error("MAIL_SERVICE_API_KEY is missing in environment variables.");
  }

  const response = await fetch(\`\${mailServiceUrl}/api/send-email\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": mailServiceApiKey,
    },
    body: JSON.stringify({
      to,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      fromName: fromName || extractSenderName(FROM),
      ...(replyTo || process.env.EMAIL_REPLY_TO
        ? { replyTo: replyTo || process.env.EMAIL_REPLY_TO }
        : {}),
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) {
    throw new Error(result.message || \`SafeMailNode error (\${response.status})\`);
  }
  return result.data;
};

module.exports = { send };`;

const TEMPLATES_SNIPPET = `// src/emails/index.ts
const baseLayout = (title: string, bodyContent: string) => \`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\${title}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
    <div style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#10b981;margin-bottom:12px;">
      Acme Cloud Platform
    </div>
    \${bodyContent}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 16px;" />
    <p style="font-size:12px;color:#64748b;margin:0;">
      &copy; \${new Date().getFullYear()} Acme Cloud Inc. All rights reserved.
    </p>
  </div>
</body>
</html>\`;

export const emailVerificationEmail = (username: string, verifyUrl: string) =>
  baseLayout(
    "Verify Your Email Address",
    \`
    <h2 style="margin:0 0 12px;font-size:20px;">Verify your email, \${username}</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Please confirm your email address to activate your workspace and API credentials.
    </p>
    <a href="\${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#10b981;color:#052e16;font-weight:700;text-decoration:none;border-radius:8px;">
      Confirm Email Address
    </a>
    \`
  );

export const welcomeEmail = (username: string, dashboardUrl: string) =>
  baseLayout(
    "Welcome to Acme Cloud",
    \`
    <h2 style="margin:0 0 12px;font-size:20px;">Welcome aboard, \${username}!</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Your account has been provisioned and is ready for use.
    </p>
    <a href="\${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#ffffff;font-weight:600;text-decoration:none;border-radius:8px;">
      Open Dashboard
    </a>
    \`
  );

export const transactionReceiptEmail = (
  username: string,
  amount: string,
  method: string,
  reference: string,
  status: "Received" | "Approved" | "Declined",
  dashboardUrl: string
) =>
  baseLayout(
    \`Transaction \${status} — \${reference}\`,
    \`
    <h2 style="margin:0 0 12px;font-size:20px;">Payment \${status}</h2>
    <p style="color:#475569;line-height:1.6;">
      Hi <strong>\${username}</strong>, your transaction of <strong>\${amount}</strong> via <strong>\${method}</strong> has been updated.
    </p>
    <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0;font-size:14px;">
      <div><strong>Reference:</strong> \${reference}</div>
      <div><strong>Amount:</strong> \${amount}</div>
      <div><strong>Method:</strong> \${method}</div>
      <div><strong>Status:</strong> \${status}</div>
    </div>
    <a href="\${dashboardUrl}" style="color:#10b981;font-weight:600;text-decoration:none;">
      View Transaction History &rarr;
    </a>
    \`
  );`;

const WORKFLOW_AUTH_SNIPPET = `// src/services/auth.service.ts
import { sendEmail } from "./email.service";
import { welcomeEmail, emailVerificationEmail, passwordResetEmail } from "../emails";

export const registerUser = async (data: { username: string; email: string }) => {
  // 1. Create user & verification token in database...
  const verificationToken = "fe9a2c4d8b...";
  const verifyUrl = \`\${process.env.CLIENT_URL}/verify-email?token=\${verificationToken}\`;

  // 2. Dispatch verification & welcome emails via SafeMailNode
  await sendEmail(
    data.email,
    "Verify your email address",
    emailVerificationEmail(data.username, verifyUrl)
  );

  await sendEmail(
    data.email,
    "Welcome to Acme Cloud",
    welcomeEmail(data.username, \`\${process.env.CLIENT_URL}/dashboard\`)
  );
};`;

const WORKFLOW_TX_SNIPPET = `// src/services/transaction.service.ts
import { sendEmail } from "./email.service";
import { transactionReceiptEmail } from "../emails";

const DASHBOARD_URL = \`\${process.env.CLIENT_URL}/dashboard/transactions\`;

export const recordPaymentRequest = async (
  user: { username: string; email: string },
  amount: number,
  methodName: string,
  reference: string
) => {
  // Dispatch immediate confirmation email to user
  await sendEmail(
    user.email,
    "Payment Request Received",
    transactionReceiptEmail(
      user.username,
      \`$\${amount.toLocaleString()}\`,
      methodName,
      reference,
      "Received",
      DASHBOARD_URL
    )
  );
};

export const approvePayment = async (
  user: { username: string; email: string },
  amount: number,
  methodName: string,
  reference: string
) => {
  // Dispatch approval receipt email after database commit
  await sendEmail(
    user.email,
    "Payment Approved",
    transactionReceiptEmail(
      user.username,
      \`$\${amount.toLocaleString()}\`,
      methodName,
      reference,
      "Approved",
      DASHBOARD_URL
    )
  );
};`;

const CURL_SNIPPET = `curl -X POST https://safemailnode.vercel.app/api/send-email \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ms_live_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c" \\
  -d '{
    "to": "customer@example.com",
    "subject": "Invoice #INV-2049 Paid",
    "fromName": "Acme Billing",
    "replyTo": "billing@acmecorp.com",
    "html": "<h2>Payment Confirmed</h2><p>Thank you for your payment of $149.00.</p>"
  }'`;

export default function DocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [serviceLang, setServiceLang] = useState<"ts" | "cjs">("ts");

  const copySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" badge="DOCS" />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition hidden sm:inline-block"
            >
              Home
            </Link>
            <Link
              href="/support"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 inline-flex items-center gap-1.5 transition"
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Support Project</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
            >
              Open Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 grid lg:grid-cols-12 gap-10">
        {/* Left Sticky Sidebar Navigation */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-6 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Documentation
              </div>
              <nav className="space-y-1.5 text-xs">
                <a
                  href="#overview"
                  className="block py-1.5 px-2.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
                >
                  1. Architecture &amp; Limits
                </a>
                <a
                  href="#quickstart"
                  className="block py-1.5 px-2.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
                >
                  2. Gmail App Password Setup
                </a>
                <a
                  href="#env"
                  className="block py-1.5 px-2.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
                >
                  3. Environment Variables
                </a>
                <a
                  href="#service-layer"
                  className="block py-1.5 px-2.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
                >
                  4. Email Service Layer
                </a>
                <a
                  href="#templates"
                  className="block py-1.5 px-2.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
                >
                  5. HTML Email Templates
                </a>
                <a
                  href="#workflows"
                  className="block py-1.5 px-2.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
                >
                  6. Auth &amp; Payment Triggers
                </a>
                <a
                  href="#api-reference"
                  className="block py-1.5 px-2.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
                >
                  7. REST API Reference
                </a>
                <a
                  href="#errors"
                  className="block py-1.5 px-2.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition"
                >
                  8. Status &amp; Error Codes
                </a>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Ready to generate your <code className="text-emerald-400">ms_live_</code> project
                key?
              </p>
              <Link
                href="/register"
                className="w-full py-2 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition"
              >
                Create Developer Account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Documentation Body */}
        <div className="lg:col-span-9 space-y-14">
          {/* Header Banner */}
          <section id="overview" className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
              <Terminal className="w-3.5 h-3.5" />
              SafeMailNode Integration Guide &amp; API Reference
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Production Email Integration Architecture
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              SafeMailNode decouples SMTP credential management from your application servers.
              Instead of embedding raw Gmail passwords across multiple microservices or fighting
              blocked outbound SMTP ports on cloud hosts, your backend dispatches a standard HTTPS{" "}
              <code className="text-emerald-300">POST /api/send-email</code> request authenticated
              with a project-scoped <code className="text-emerald-300">x-api-key</code>.
            </p>

            {/* Architecture Cards */}
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <Key className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="font-semibold text-sm mb-1">AES-256-GCM Vault</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Google 16-character App Passwords are encrypted at rest and decrypted only in
                  ephemeral memory during TLS 465 dispatch.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <Layers className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="font-semibold text-sm mb-1">Default Quotas</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every verified account includes <strong>2 Project Slots</strong> and{" "}
                  <strong>100 Daily Emails (UTC)</strong>, expandable on demand by administrators.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="font-semibold text-sm mb-1">60 req/min Rate Limit</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sliding-window rate limiting per API key protects your Gmail account reputation
                  from accidental loops or abuse.
                </p>
              </div>
            </div>
          </section>

          {/* Step 2: Prerequisites & Google App Password */}
          <section id="quickstart" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-2xl font-bold flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">
                1
              </span>
              Generate Your Google App Password &amp; Project Key
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Before integrating SafeMailNode into your backend codebase, configure a Gmail sender
              project in your developer console:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-emerald-400">
                  Step A — Google Account Security
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Open your{" "}
                    <strong className="text-white">Google Account &rarr; Security</strong> settings.
                  </li>
                  <li>
                    Enable <strong className="text-white">2-Step Verification</strong> if not
                    already active.
                  </li>
                  <li>
                    Search for <strong className="text-white">App passwords</strong> and generate a
                    new 16-character password (e.g., <code className="text-emerald-300">abcd efgh ijkl mnop</code>).
                  </li>
                </ol>
              </div>
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-emerald-400">
                  Step B — SafeMailNode Console
                </div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Register and verify your email on{" "}
                    <Link href="/register" className="text-emerald-400 underline">
                      SafeMailNode
                    </Link>
                    .
                  </li>
                  <li>
                    Click <strong className="text-white">Add Gmail Configuration</strong> and enter
                    your Gmail address, Default Sender Name, and 16-char App Password.
                  </li>
                  <li>
                    Click <strong className="text-white">Send Test Email</strong> to verify SMTP
                    delivery, then copy your <code className="text-emerald-300">ms_live_...</code>{" "}
                    API key.
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* Step 3: Environment Variables */}
          <section id="env" className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                Environment Variables (.env)
              </h2>
              <button
                onClick={() => copySnippet("env", ENV_SNIPPET)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
              >
                {copiedId === "env" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy .env
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-slate-400">
              Add the following variables to your backend <code className="text-slate-200">.env</code>{" "}
              file (and your cloud deployment environment variables on Render, Railway, AWS, or
              Vercel):
            </p>
            <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              {ENV_SNIPPET}
            </pre>
          </section>

          {/* Step 4: Core Email Service Layer */}
          <section id="service-layer" className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                Core Email Service Layer
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setServiceLang("ts")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    serviceLang === "ts"
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  TypeScript (email.service.ts)
                </button>
                <button
                  onClick={() => setServiceLang("cjs")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    serviceLang === "cjs"
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  CommonJS (emailService.js)
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Create a centralized email service module in your backend. All controllers and domain
              services call <code className="text-emerald-300">sendEmail(to, subject, html, options)</code>{" "}
              without needing to know about SMTP transports or credentials.
            </p>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  {serviceLang === "ts"
                    ? "src/services/email.service.ts"
                    : "services/emailService.js"}
                </span>
                <button
                  onClick={() =>
                    copySnippet(
                      "service",
                      serviceLang === "ts" ? TS_SERVICE_SNIPPET : CJS_SERVICE_SNIPPET
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                >
                  {copiedId === "service" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {serviceLang === "ts" ? TS_SERVICE_SNIPPET : CJS_SERVICE_SNIPPET}
              </pre>
            </div>
          </section>

          {/* Step 5: HTML Email Template Builder Pattern */}
          <section id="templates" className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  4
                </span>
                HTML Email Template Builder Pattern
              </h2>
              <button
                onClick={() => copySnippet("templates", TEMPLATES_SNIPPET)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
              >
                {copiedId === "templates" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Templates
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Keep your HTML email layouts modular by exporting pure template functions from{" "}
              <code className="text-slate-200">src/emails/index.ts</code>. Each function returns a
              complete HTML string wrapped in a shared brand layout:
            </p>
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  src/emails/index.ts
                </span>
              </div>
              <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {TEMPLATES_SNIPPET}
              </pre>
            </div>
          </section>

          {/* Step 6: Calling sendEmail in Auth & Transactional Workflows */}
          <section id="workflows" className="space-y-6 pt-4 border-t border-slate-800/80">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2.5 mb-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  5
                </span>
                Triggering Emails in Auth &amp; Transactional Services
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Import <code className="text-emerald-300">sendEmail</code> into your authentication
                and transaction services so users receive real-time emails on registration,
                verification, payment submission, and approval.
              </p>
            </div>

            {/* Auth Workflow */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  Authentication Service — Registration &amp; Verification
                </span>
                <button
                  onClick={() => copySnippet("workflow-auth", WORKFLOW_AUTH_SNIPPET)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                >
                  {copiedId === "workflow-auth" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {WORKFLOW_AUTH_SNIPPET}
              </pre>
            </div>

            {/* Transaction Workflow */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  Transaction Service — Payment Request &amp; Approval Receipts
                </span>
                <button
                  onClick={() => copySnippet("workflow-tx", WORKFLOW_TX_SNIPPET)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                >
                  {copiedId === "workflow-tx" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {WORKFLOW_TX_SNIPPET}
              </pre>
            </div>
          </section>

          {/* Step 7: REST API Reference */}
          <section id="api-reference" className="space-y-6 pt-4 border-t border-slate-800/80">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2.5 mb-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  6
                </span>
                REST API Endpoint Reference
              </h2>
              <p className="text-sm text-slate-400">
                You can also call SafeMailNode directly from any language (Python, Go, PHP, Ruby,
                cURL, or mobile backends).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                POST
              </span>
              <span className="text-white">https://safemailnode.vercel.app/api/send-email</span>
            </div>

            {/* Request Parameters Table */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 text-xs font-bold uppercase text-slate-300">
                JSON Request Body Parameters
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-4">Field</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Required</th>
                      <th className="py-3 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    <tr>
                      <td className="py-3 px-4 font-mono text-emerald-400">to</td>
                      <td className="py-3 px-4 font-mono text-slate-300">string | string[]</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">Yes</td>
                      <td className="py-3 px-4 text-slate-300">
                        Recipient email address or array of recipient addresses.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-emerald-400">subject</td>
                      <td className="py-3 px-4 font-mono text-slate-300">string</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">Yes</td>
                      <td className="py-3 px-4 text-slate-300">Email subject line.</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-emerald-400">html</td>
                      <td className="py-3 px-4 font-mono text-slate-300">string</td>
                      <td className="py-3 px-4 text-amber-300">html or text</td>
                      <td className="py-3 px-4 text-slate-300">
                        HTML email body content (recommended for styled transactional emails).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-emerald-400">text</td>
                      <td className="py-3 px-4 font-mono text-slate-300">string</td>
                      <td className="py-3 px-4 text-amber-300">html or text</td>
                      <td className="py-3 px-4 text-slate-300">
                        Plain-text fallback or plain-text body if HTML is omitted.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-emerald-400">fromName</td>
                      <td className="py-3 px-4 font-mono text-slate-300">string</td>
                      <td className="py-3 px-4 text-slate-500">Optional</td>
                      <td className="py-3 px-4 text-slate-300">
                        Overrides the project&apos;s Default Sender Name for this specific email.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-emerald-400">replyTo</td>
                      <td className="py-3 px-4 font-mono text-slate-300">string</td>
                      <td className="py-3 px-4 text-slate-500">Optional</td>
                      <td className="py-3 px-4 text-slate-300">
                        Custom Reply-To address (e.g., <code>support@acmecorp.com</code>).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-emerald-400">cc / bcc</td>
                      <td className="py-3 px-4 font-mono text-slate-300">string | string[]</td>
                      <td className="py-3 px-4 text-slate-500">Optional</td>
                      <td className="py-3 px-4 text-slate-300">
                        Carbon copy or blind carbon copy recipients.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* cURL Example */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">cURL Request Example</span>
                <button
                  onClick={() => copySnippet("curl", CURL_SNIPPET)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
                >
                  {copiedId === "curl" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy cURL
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {CURL_SNIPPET}
              </pre>
            </div>
          </section>

          {/* Step 8: Status & Troubleshooting */}
          <section id="errors" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-2xl font-bold flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">
                7
              </span>
              HTTP Status Codes &amp; Troubleshooting
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  200 OK — Email Sent
                </div>
                <p className="text-xs text-slate-400">
                  Message accepted by Gmail TLS SMTP server and logged in your Delivery Logs.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  401 Unauthorized — Invalid or Missing Key
                </div>
                <p className="text-xs text-slate-400">
                  Verify that <code>x-api-key</code> matches your active <code>ms_live_...</code>{" "}
                  key and your backend server was restarted after updating <code>.env</code>.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  403 Forbidden — Unverified or Frozen Account
                </div>
                <p className="text-xs text-slate-400">
                  Ensure your SafeMailNode account email is verified and your project/account is not
                  paused or frozen.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  429 Too Many Requests — Quota / Rate Limit
                </div>
                <p className="text-xs text-slate-400">
                  Triggered when exceeding 60 requests/min per key or reaching your daily email
                  limit (100/day default).
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
