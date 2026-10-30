"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, Terminal, Copy, Check, Key, ShieldCheck,
  Layers, Code2, Send, AlertTriangle, ArrowRight, Heart, CheckCircle2,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import Footer from "@/components/Footer";

const ENV_SNIPPET = `MAIL_SERVICE_URL=https://yourdomain.com
MAIL_SERVICE_API_KEY=ms_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`;

const TS_SNIPPET = `// lib/email.ts
export async function sendEmail(payload: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}) {
  const url = process.env.MAIL_SERVICE_URL;
  const apiKey = process.env.MAIL_SERVICE_API_KEY;
  if (!url || !apiKey) throw new Error("MAIL_SERVICE_URL or MAIL_SERVICE_API_KEY not set");

  const res = await fetch(\`\${url}/api/send-email\`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || \`SafeMailNode error \${res.status}\`);
  }
  return data.data as { messageId: string; project: string; from: string };
}`;

const CJS_SNIPPET = `// services/email.js (CommonJS / Express)
const sendEmail = async ({ to, subject, html, text, fromName, replyTo, cc, bcc }) => {
  const url = process.env.MAIL_SERVICE_URL;
  const apiKey = process.env.MAIL_SERVICE_API_KEY;
  if (!url || !apiKey) throw new Error("MAIL_SERVICE_URL or MAIL_SERVICE_API_KEY not set");

  const res = await fetch(\`\${url}/api/send-email\`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ to, subject, html, text, fromName, replyTo, cc, bcc }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || \`SafeMailNode error \${res.status}\`);
  return data.data;
};

module.exports = { sendEmail };`;

const CURL_SNIPPET = `curl -X POST https://yourdomain.com/api/send-email \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ms_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -d '{
    "to": "user@example.com",
    "subject": "Welcome!",
    "fromName": "My App",
    "html": "<h1>Welcome aboard</h1><p>Thanks for signing up.</p>"
  }'`;

const RESPONSE_SNIPPET = `// 200 OK
{
  "success": true,
  "data": {
    "messageId": "<abc123@smtp.gmail.com>",
    "project": "My App",
    "from": "notifications@gmail.com"
  }
}

// Error (4xx / 5xx)
{
  "success": false,
  "message": "Daily email quota exceeded"
}`;

export default function DocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lang, setLang] = useState<"ts" | "cjs">("ts");

  const copy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CopyBtn = ({ id, code }: { id: string; code: string }) => (
    <button
      onClick={() => copy(id, code)}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition"
    >
      {copiedId === id ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" badge="DOCS" />
          <div className="flex items-center gap-3">
            <Link href="/" className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition hidden sm:inline-block">
              Home
            </Link>
            <Link href="/support" className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 inline-flex items-center gap-1.5 transition">
              <Heart className="w-3.5 h-3.5" /><span className="hidden sm:inline">Support</span>
            </Link>
            <Link href="/dashboard" className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 grid lg:grid-cols-12 gap-10">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-6 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />Integration Guide
              </div>
              <nav className="space-y-1 text-xs">
                {[
                  ["#how-it-works", "How it works"],
                  ["#setup", "1. Create a project"],
                  ["#env", "2. Environment variables"],
                  ["#service", "3. Email service helper"],
                  ["#api", "4. API reference"],
                  ["#errors", "5. Error codes"],
                ].map(([href, label]) => (
                  <a key={href} href={href} className="block py-1.5 px-2.5 rounded-lg text-slate-300 hover:bg-slate-800/70 hover:text-white transition">
                    {label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="pt-4 border-t border-slate-800/80">
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Need an API key? Create a free account and add a Gmail project.
              </p>
              <Link href="/register" className="w-full py-2 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition">
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Body */}
        <div className="lg:col-span-9 space-y-14">

          {/* How it works */}
          <section id="how-it-works" className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
              <Terminal className="w-3.5 h-3.5" />SafeMailNode Integration Guide
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Send emails from any app</h1>
            <p className="text-slate-400 text-base leading-relaxed">
              SafeMailNode is a self-hosted HTTPS email gateway. You configure a Gmail address and App Password once in the dashboard, get an <code className="text-emerald-300">ms_live_...</code> API key, and call <code className="text-emerald-300">POST /api/send-email</code> from any backend — no SMTP config, no credentials in your app.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <Key className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="font-semibold text-sm mb-1">Credentials encrypted</div>
                <p className="text-xs text-slate-400 leading-relaxed">App Passwords are stored with AES-256-GCM and never exposed after save.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <Layers className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="font-semibold text-sm mb-1">Per-account quotas</div>
                <p className="text-xs text-slate-400 leading-relaxed">Default: 2 projects, 100 emails/day. Admins can raise limits per user.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="font-semibold text-sm mb-1">API keys hashed</div>
                <p className="text-xs text-slate-400 leading-relaxed">Keys are bcrypt-hashed at rest. The raw key is shown once — save it immediately.</p>
              </div>
            </div>
          </section>

          {/* Step 1: Create a project */}
          <section id="setup" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-2xl font-bold flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
              Create a project &amp; get your API key
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-emerald-400">Google App Password</div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Go to <strong className="text-white">Google Account → Security</strong>.</li>
                  <li>Enable <strong className="text-white">2-Step Verification</strong>.</li>
                  <li>Search <strong className="text-white">App passwords</strong>, create one for "Mail", copy the 16-character code.</li>
                </ol>
              </div>
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase text-emerald-400">SafeMailNode Dashboard</div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li><Link href="/register" className="text-emerald-400 underline">Register</Link> and verify your email.</li>
                  <li>Click <strong className="text-white">Add Gmail Configuration</strong> — enter your Gmail address, sender name, and App Password.</li>
                  <li>Send a test email to confirm delivery, then <strong className="text-white">copy your API key</strong> — it is shown only once.</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Step 2: Env vars */}
          <section id="env" className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
                Environment variables
              </h2>
              <CopyBtn id="env" code={ENV_SNIPPET} />
            </div>
            <p className="text-sm text-slate-400">Add these to your backend <code className="text-slate-200">.env</code> and your deployment environment (Vercel, Railway, Render, etc.):</p>
            <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">{ENV_SNIPPET}</pre>
          </section>

          {/* Step 3: Service helper */}
          <section id="service" className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">3</span>
                Email service helper
              </h2>
              <div className="flex items-center gap-2">
                {(["ts", "cjs"] as const).map((l) => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${lang === l ? "bg-emerald-500 text-slate-950" : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"}`}>
                    {l === "ts" ? "TypeScript" : "CommonJS"}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drop this helper into your project. Every route or service that needs to send an email calls <code className="text-emerald-300">sendEmail()</code> — no SMTP config anywhere else.
            </p>
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  {lang === "ts" ? "lib/email.ts" : "services/email.js"}
                </span>
                <CopyBtn id="service" code={lang === "ts" ? TS_SNIPPET : CJS_SNIPPET} />
              </div>
              <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                {lang === "ts" ? TS_SNIPPET : CJS_SNIPPET}
              </pre>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">Usage example:</p>
            <pre className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">{`await sendEmail({
  to: "user@example.com",
  subject: "Your order has shipped",
  fromName: "My Store",
  html: "<h2>Order #1234 shipped!</h2><p>Track it here: ...</p>",
});`}</pre>
          </section>

          {/* Step 4: API reference */}
          <section id="api" className="space-y-6 pt-4 border-t border-slate-800/80">
            <h2 className="text-2xl font-bold flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">4</span>
              API reference
            </h2>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">POST</span>
              <span className="text-white">/api/send-email</span>
              <span className="text-slate-400 ml-auto">Header: <code className="text-emerald-300">x-api-key: ms_live_...</code></span>
            </div>

            {/* Request body table */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 text-xs font-bold uppercase text-slate-300">Request body (JSON)</div>
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
                    {[
                      ["to", "string | string[]", "Yes", "Recipient address(es)."],
                      ["subject", "string", "Yes", "Email subject line."],
                      ["html", "string", "html or text", "HTML body (recommended)."],
                      ["text", "string", "html or text", "Plain-text body or fallback."],
                      ["fromName", "string", "No", "Overrides the project's default sender name for this send."],
                      ["replyTo", "string", "No", "Reply-To address."],
                      ["cc", "string | string[]", "No", "CC recipients."],
                      ["bcc", "string | string[]", "No", "BCC recipients."],
                    ].map(([field, type, req, desc]) => (
                      <tr key={field}>
                        <td className="py-3 px-4 font-mono text-emerald-400">{field}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{type}</td>
                        <td className={`py-3 px-4 font-semibold ${req === "Yes" ? "text-emerald-400" : req === "No" ? "text-slate-500" : "text-amber-300"}`}>{req}</td>
                        <td className="py-3 px-4 text-slate-300">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* cURL + response */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 flex items-center gap-2"><Send className="w-3.5 h-3.5 text-emerald-400" />cURL</span>
                  <CopyBtn id="curl" code={CURL_SNIPPET} />
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">{CURL_SNIPPET}</pre>
              </div>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300">Response</span>
                  <CopyBtn id="response" code={RESPONSE_SNIPPET} />
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">{RESPONSE_SNIPPET}</pre>
              </div>
            </div>
          </section>

          {/* Step 5: Error codes */}
          <section id="errors" className="space-y-4 pt-4 border-t border-slate-800/80">
            <h2 className="text-2xl font-bold flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center">5</span>
              HTTP status codes
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { color: "emerald", icon: <CheckCircle2 className="w-4 h-4" />, title: "200 — Sent", desc: "Email accepted by Gmail SMTP and logged in your delivery logs." },
                { color: "amber", icon: <AlertTriangle className="w-4 h-4" />, title: "401 — Invalid API key", desc: "The x-api-key header is missing, revoked, or doesn't match any active project." },
                { color: "amber", icon: <AlertTriangle className="w-4 h-4" />, title: "403 — Account restricted", desc: "Your account is unverified, frozen, or suspended. Check your dashboard." },
                { color: "amber", icon: <AlertTriangle className="w-4 h-4" />, title: "429 — Rate limited", desc: "You've exceeded the per-minute rate limit or your daily email quota (100/day default)." },
                { color: "rose", icon: <AlertTriangle className="w-4 h-4" />, title: "500 — SMTP failure", desc: "Gmail rejected the send. Usually an incorrect App Password or a revoked Google session." },
              ].map(({ color, icon, title, desc }) => (
                <div key={title} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className={`flex items-center gap-2 text-xs font-bold text-${color}-400`}>{icon}{title}</div>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
