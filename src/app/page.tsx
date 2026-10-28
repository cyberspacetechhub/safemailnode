import Link from "next/link";
import { Key, ShieldCheck, Zap, ArrowRight, Terminal, Layers, Heart } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" badge="Gmail SMTP API" />
          <div className="flex items-center gap-3">
            <Link
              href="/support"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 inline-flex items-center gap-1.5 transition"
            >
              <Heart className="w-3.5 h-3.5" />
              Support Project
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
            >
              Get API Key
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
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
              . Create an account, verify your email, enter your Gmail address &amp; 16-character
              Google App Password, and get an instant{" "}
              <code className="text-emerald-300">x-api-key</code> to send emails from any Express,
              Next.js, or mobile project.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition"
              >
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-pink-300 font-medium transition"
              >
                <Heart className="w-4 h-4" />
                Support Our Project
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
              <span className="text-[11px] font-mono text-emerald-400">200 OK</span>
            </div>
            <pre className="p-5 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`await fetch("https://safemailnode.vercel.app/api/send-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "ms_live_9f8a7b6c5d4e..."
  },
  body: JSON.stringify({
    to: "user@example.com",
    subject: "Verify your account",
    fromName: "Alpha Rise Global", // Optional override
    html: "<h1>Welcome aboard!</h1><p>Your code is 482910</p>"
  })
});`}
            </pre>
          </div>
        </section>

        {/* Features */}
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
              Built-in rate limiting, email verification, and daily quota protection keep your
              Gmail reputation safe.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
