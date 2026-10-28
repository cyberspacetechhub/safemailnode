"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, RefreshCw, LogOut } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        if (json.data?.isEmailVerified) {
          router.push("/dashboard");
        } else {
          setUserEmail(json.data?.email || "");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Verification failed");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Network error");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Could not resend verification code");
      } else {
        setMessage(data.message || "Verification code resent!");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#090d16] text-slate-100">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <BrandLogo href="/" />
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-bold mb-1">Verify your email address</h1>
        <p className="text-sm text-slate-400 mb-6">
          We sent a 6-digit verification code to{" "}
          <span className="text-slate-200 font-medium">{userEmail || "your email"}</span>. Enter it
          below to unlock your dashboard.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-center text-xl font-mono tracking-[0.4em] text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Verify &amp; Continue
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Didn&apos;t receive the code?</span>
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-emerald-400 hover:underline font-medium inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}
