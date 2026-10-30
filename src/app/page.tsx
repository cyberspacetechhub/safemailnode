import Link from "next/link";
import {
  Key,
  ShieldCheck,
  Zap,
  ArrowRight,
  Terminal,
  Layers,
  Heart,
  BookOpen,
  Activity,
  Server,
  Globe,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" badge="Gmail SMTP API" />
          <div className="flex items-center gap-2">
            {/* Desktop nav */}
            <Link href="/docs" className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 items-center gap-1.5 transition">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />Docs
            </Link>
            <Link href="/support" className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 items-center gap-1.5 transition">
              <Heart className="w-3.5 h-3.5" />Support
            </Link>
            <Link href="/login" className="hidden sm:inline-flex px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="hidden sm:inline-flex px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition">
              Get API Key
            </Link>
            {/* Mobile hamburger */}
            <MobileNav items={[
              { label: "Docs", href: "/docs", icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
              { label: "Support", href: "/support", icon: <Heart className="w-4 h-4 text-pink-400" />, variant: "pink" },
              { label: "Sign In", href: "/login" },
              { label: "Get API Key", href: "/register" },
            ]} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-6">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              2 Free Project Slots &amp; 100 Daily Emails Included
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-5">
              Send transactional emails with{" "}
              <span className="text-emerald-400">your own Gmail</span> over a simple REST API.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Welcome to{" "}
              <span className="font-semibold text-white">
                Safe<span className="text-emerald-400">Mail</span>Node
              </span>
              . Connect your Gmail address and 16-character Google App Password, generate a
              project-scoped <code className="text-emerald-300">x-api-key</code>, and dispatch
              verification codes, invoices, and alerts from any Node.js, Next.js, Python, or
              serverless backend—even on hosts that block outbound SMTP ports.
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition"
              >
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium transition"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Read Documentation
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-pink-300 font-medium transition"
              >
                <Heart className="w-4 h-4" />
                Support Project
              </Link>
            </div>
          </div>

          {/* Code Preview */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-slate-400">POST /api/send-email</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">200 OK • TLS 465</span>
            </div>
            <pre className="p-5 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`await fetch("https://safemailnode.vercel.app/api/send-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.MAIL_SERVICE_API_KEY
  },
  body: JSON.stringify({
    to: "customer@example.com",
    subject: "Confirm your account email",
    fromName: "Acme Cloud",
    replyTo: "support@acmecorp.com",
    html: "<h2>Welcome to Acme Cloud</h2><p>Your code is <strong>482910</strong></p>"
  })
});`}
            </pre>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl font-bold mb-2">How SafeMailNode Works</h2>
              <p className="text-sm text-slate-400">
                Go from zero to production transactional email delivery in under five minutes.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-xs font-bold text-emerald-400 uppercase mb-1.5">Step 01</div>
                <h3 className="font-semibold text-base mb-1.5">Verify &amp; Connect Gmail</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Create your developer account, verify your email, and add your Gmail address with
                  a 16-character Google App Password.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-xs font-bold text-emerald-400 uppercase mb-1.5">Step 02</div>
                <h3 className="font-semibold text-base mb-1.5">Copy Your Project API Key</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Each project receives an isolated <code className="text-emerald-300">ms_live_...</code>{" "}
                  key and custom default sender display name.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="text-xs font-bold text-emerald-400 uppercase mb-1.5">Step 03</div>
                <h3 className="font-semibold text-base mb-1.5">Send Over HTTPS</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Call <code className="text-emerald-300">POST /api/send-email</code> from your
                  service layer and monitor delivery in real time from your console.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-6xl mx-auto px-6 pb-20 grid sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Key className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-base mb-1.5">AES-256 Encrypted Credentials</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your 16-character Google App Password is encrypted at rest using AES-256-GCM and only
              decrypted in memory when dispatching an email.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Layers className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-base mb-1.5">Multi-Project Isolation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Start with 2 dedicated project configurations and 100 daily emails, with isolated API
              keys, custom sender names, and live delivery logs.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-base mb-1.5">Rate-Limited &amp; Verified</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Built-in sliding-window rate limiting, email verification, and daily quota protection
              keep your Gmail reputation safe.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Server className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-base mb-1.5">Bypass Cloud SMTP Blocks</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Cloud providers often block outbound SMTP ports 465 and 587. SafeMailNode lets your
              apps send over standard HTTPS port 443.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Activity className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-base mb-1.5">Real-Time Delivery Audit Logs</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Inspect every sent or failed email, SMTP message ID, recipient address, and error
              diagnostic from your dashboard.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <Globe className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-base mb-1.5">Framework-Agnostic REST API</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Drop into Express, Next.js, NestJS, Django, Laravel, or Go with a single{" "}
              <code className="text-emerald-300">fetch</code> helper—no heavy SDK required.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
