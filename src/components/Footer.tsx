import Link from "next/link";
import { ShieldCheck, Lock, Zap, BookOpen, Heart, Terminal } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800/80 bg-[#070a12] text-slate-400">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-slate-800/70">
          {/* Brand & Mission */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo href="/" badge="SMTP API Gateway" />
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              A secure, developer-first transactional email relay powered by your own Gmail SMTP
              credentials. Dispatch verification codes, receipts, and system alerts over a single
              REST API endpoint.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <Lock className="w-3 h-3 text-emerald-400" />
                AES-256-GCM Encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                TLS 465 SMTP
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                <Zap className="w-3 h-3 text-emerald-400" />
                Rate-Limited API
              </span>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition">
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="hover:text-emerald-400 transition inline-flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition">
                  Developer Console
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="hover:text-pink-400 transition inline-flex items-center gap-1.5 text-pink-300/90"
                >
                  <Heart className="w-3.5 h-3.5" />
                  Support Project
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Developers &amp; Guides
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/docs#setup"
                  className="hover:text-emerald-400 transition inline-flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  Quick Start
                </Link>
              </li>
              <li>
                <Link href="/docs#service" className="hover:text-emerald-400 transition">
                  TypeScript &amp; Node.js Helper
                </Link>
              </li>
              <li>
                <Link href="/docs#api" className="hover:text-emerald-400 transition">
                  REST API Reference
                </Link>
              </li>
              <li>
                <Link href="/docs#errors" className="hover:text-emerald-400 transition">
                  Error Codes
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register" className="hover:text-emerald-400 transition">
                  Get API Key
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/verify-email" className="hover:text-emerald-400 transition">
                  Verify Email
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-emerald-400 transition">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition">Terms of Service</Link>
              </li>
              <li>
                <Link href="/acceptable-use" className="hover:text-emerald-400 transition">Acceptable Use</Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-emerald-400 transition">Cookie Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {year}{" "}
            <span className="text-slate-300 font-semibold">
              Safe<span className="text-emerald-400">Mail</span>Node
            </span>
            . All rights reserved. Built for reliable transactional email delivery.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">SMTP Gateway &amp; REST API Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
