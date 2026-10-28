"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function AdminOneTimeRegisterPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [alreadyInitialized, setAlreadyInitialized] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auth/register", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.initialized) {
          setAlreadyInitialized(true);
        }
      })
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Admin initialization failed");
        if (data.code === "ADMIN_ALREADY_INITIALIZED") {
          setAlreadyInitialized(true);
        }
        setLoading(false);
        return;
      }
      router.push("/admin");
    } catch (err: any) {
      setError(err?.message || "Network error");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-amber-400" />
        Checking administrator setup status...
      </div>
    );
  }

  if (alreadyInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#090d16] text-slate-100">
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shadow-2xl">
          <div className="mb-5 flex justify-center">
            <BrandLogo href="/" badge="ADMIN" badgeVariant="amber" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold mb-2">One-Time Admin Setup Locked</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            The primary Administrator account has already been initialized. Additional
            administrators can only be created from inside the Admin Control Panel by an existing
            administrator.
          </p>
          <Link
            href="/admin/login"
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm inline-flex items-center justify-center gap-2 transition"
          >
            Go to Admin Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#090d16] text-slate-100">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-2xl">
        <div className="mb-6">
          <BrandLogo href="/" badge="ONE-TIME SETUP" badgeVariant="amber" />
        </div>

        <h1 className="text-2xl font-bold mb-1">Create Primary Administrator</h1>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          This registration page works <strong>only once</strong>. After this account is created,
          this page will permanently lock and only you will be able to add other admins.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Administrator Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Super Admin"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Administrator Email
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Master Password (min. 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Initialize Primary Admin &amp; Lock Page
          </button>
        </form>
      </div>
    </div>
  );
}
