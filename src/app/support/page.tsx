"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Heart,
  Building2,
  Coins,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Mail,
  BookOpen,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import Footer from "@/components/Footer";

interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency?: string;
  routingOrSwift?: string;
  note?: string;
}

interface CryptoWallet {
  coin: string;
  network: string;
  walletAddress: string;
  note?: string;
}

interface PaymentLink {
  label: string;
  url: string;
  description?: string;
}

interface SupportSettings {
  isSupportEnabled: boolean;
  supportTitle: string;
  supportSubtitle: string;
  supportMessage: string;
  contactEmail?: string;
  bankAccounts: BankAccount[];
  cryptoWallets: CryptoWallet[];
  paymentLinks: PaymentLink[];
}

export default function SupportProjectPage() {
  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const loadSupportSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/support?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupportSettings();
    const onFocus = () => loadSupportSettings();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadSupportSettings]);

  const copyValue = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedText(val);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-emerald-400" />
        Loading support details...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/70 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" />

          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              Docs
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {settings?.supportTitle || "Support SafeMailNode Development"}
          </h1>
          <p className="text-slate-300 text-base leading-relaxed mb-3">
            {settings?.supportSubtitle}
          </p>
          {settings?.supportMessage && (
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
              {settings.supportMessage}
            </p>
          )}
        </div>

        {!settings?.isSupportEnabled ? (
          <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
            Support contributions are currently paused. Thank you for using SafeMailNode!
          </div>
        ) : (
          <div className="space-y-8">
            {/* Payment / Donation Links */}
            {settings.paymentLinks && settings.paymentLinks.length > 0 && (
              <section className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-emerald-400" />
                  Direct Support &amp; Donation Links
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {settings.paymentLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between transition group"
                    >
                      <div>
                        <div className="font-semibold text-sm text-white group-hover:text-emerald-400 transition">
                          {link.label || link.url}
                        </div>
                        {link.description && (
                          <div className="text-xs text-slate-400 mt-0.5">{link.description}</div>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Bank Transfer Accounts */}
            {settings.bankAccounts && settings.bankAccounts.length > 0 && (
              <section className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  Bank Transfer Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {settings.bankAccounts.map((bank, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{bank.bankName}</span>
                        {bank.currency && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                            {bank.currency}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Account Name:{" "}
                        <span className="text-slate-200 font-medium">{bank.accountName}</span>
                      </div>
                      {bank.accountNumber && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <code className="text-sm font-mono text-emerald-400 font-semibold">
                            {bank.accountNumber}
                          </code>
                          <button
                            onClick={() => copyValue(bank.accountNumber)}
                            className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1"
                          >
                            {copiedText === bank.accountNumber ? (
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
                      )}
                      {bank.routingOrSwift && (
                        <div className="text-xs text-slate-400">
                          Routing / SWIFT:{" "}
                          <span className="text-slate-200 font-mono">{bank.routingOrSwift}</span>
                        </div>
                      )}
                      {bank.note && <div className="text-xs text-slate-500">{bank.note}</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Crypto Wallets */}
            {settings.cryptoWallets && settings.cryptoWallets.length > 0 && (
              <section className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  Cryptocurrency Support Wallets
                </h2>
                <div className="space-y-3">
                  {settings.cryptoWallets.map((wallet, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-white">{wallet.coin}</span>
                          {wallet.network && (
                            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                              {wallet.network}
                            </span>
                          )}
                        </div>
                        <code className="text-xs font-mono text-slate-300 break-all">
                          {wallet.walletAddress}
                        </code>
                        {wallet.note && (
                          <div className="text-xs text-slate-500 mt-1">{wallet.note}</div>
                        )}
                      </div>
                      {wallet.walletAddress && (
                        <button
                          onClick={() => copyValue(wallet.walletAddress)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 inline-flex items-center gap-1.5 shrink-0"
                        >
                          {copiedText === wallet.walletAddress ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Address
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contact Email Card */}
            {settings.contactEmail && (
              <section className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Contact &amp; Sponsorship Inquiries
                    </div>
                    <div className="text-xs text-slate-400">
                      Need higher project limits, custom daily quotas, or direct support?
                    </div>
                  </div>
                </div>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition"
                >
                  {settings.contactEmail}
                </a>
              </section>
            )}

            {/* Empty fallback only if no payment methods and no contact email are configured */}
            {(!settings.bankAccounts || settings.bankAccounts.length === 0) &&
              (!settings.cryptoWallets || settings.cryptoWallets.length === 0) &&
              (!settings.paymentLinks || settings.paymentLinks.length === 0) &&
              !settings.contactEmail && (
                <div className="p-10 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center">
                  <p className="text-sm text-slate-400">
                    Support payment channels are being updated by the team. Check back soon!
                  </p>
                </div>
              )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
