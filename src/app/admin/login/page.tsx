"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Admin authentication failed");
        setLoading(false);
        return;
      }
      router.push("/admin");
    } catch (err: any) {
      setError(err?.message || "Network error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#090d16] text-slate-100">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-2xl">
        <div className="mb-6">
          <BrandLogo href="/" badge="ADMIN" badgeVariant="amber" />
        </div>

        <h1 className="text-2xl font-bold mb-1">Administrator Sign In</h1>
        <p className="text-xs text-slate-400 mb-6">
          Restricted portal for SafeMailNode administrators only.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Admin Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourdomain.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In to Admin Portal
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            ← Return to Home
          </Link>
          <Link href="/admin/register" className="text-amber-400/80 hover:text-amber-300">
            Initial Setup
          </Link>
        </div>
      </div>
    </div>
  );
}
