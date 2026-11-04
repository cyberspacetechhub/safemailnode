"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, User, Lock, ShieldCheck, Trash2, Monitor, Clock, Shield, XCircle } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  isFrozen: boolean;
  isEmailVerified: boolean;
  maxProjects: number;
  dailyQuota: number;
  sentToday: number;
}

interface SessionItem {
  sessionId: string;
  ip?: string;
  userAgent?: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface AuditItem {
  _id: string;
  action: string;
  detail?: string;
  ip?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  // Audit log
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/auth/sessions");
    const data = await res.json();
    if (data.success) setSessions(data.data);
  }, []);

  const fetchAuditLog = useCallback(async (page: number) => {
    const res = await fetch(`/api/auth/audit-log?page=${page}&limit=10`);
    const data = await res.json();
    if (data.success) {
      setAuditLogs(data.data);
      setAuditTotalPages(data.pagination.totalPages);
    }
  }, []);

  useEffect(() => {
    fetch(`/api/auth/me?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.data) { router.push("/login"); return; }
        if (!json.data.isEmailVerified) { router.push("/verify-email"); return; }
        setUser(json.data);
        setProfileName(json.data.name);
        setProfileEmail(json.data.email);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
    fetchSessions();
    fetchAuditLog(1);
  }, [router, fetchSessions, fetchAuditLog]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
        fetchAuditLog(auditPage);
      }
    } finally {
      setRevokingSession(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const body: Record<string, string> = {};
      if (profileName !== user?.name) body.name = profileName;
      if (profileEmail !== user?.email) body.email = profileEmail;

      if (Object.keys(body).length === 0) {
        setProfileMsg({ type: "error", text: "No changes to save." });
        setProfileSaving(false);
        return;
      }

      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setProfileMsg({ type: "error", text: data.message || "Failed to update profile." });
      } else {
        setProfileMsg({ type: "success", text: data.message });
        if (data.emailChanged) {
          router.push("/verify-email");
        } else {
          setUser((u) => u ? { ...u, name: data.data.name, email: data.data.email } : u);
        }
      }
    } catch {
      setProfileMsg({ type: "error", text: "Network error." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPasswordMsg({ type: "error", text: data.message || "Failed to change password." });
      } else {
        setPasswordMsg({ type: "success", text: data.message });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMsg({ type: "error", text: "Network error." });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.message || "Failed to delete account.");
        setDeleteLoading(false);
        return;
      }
      router.push("/login?deleted=1");
    } catch {
      setDeleteError("Network error.");
      setDeleteLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-emerald-400" />
        Loading...
      </div>
    );
  }

  return (
    <DashboardShell user={user} onLogout={handleLogout}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your account details and security settings.</p>
        </div>

        {/* Profile Info */}
        <section className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white">Personal Information</h2>
          </div>

          {profileMsg && (
            <div className={`mb-4 p-3 rounded-lg text-xs border ${profileMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
              {profileEmail !== user.email && (
                <p className="mt-1.5 text-[11px] text-amber-400">⚠ Changing your email will require re-verification. You will be redirected to verify your new address.</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Plan: <span className="text-slate-200 font-semibold uppercase">{user.plan}</span>
                <span className="text-slate-600">•</span>
                Role: <span className="text-slate-200 font-semibold capitalize">{user.role}</span>
              </div>
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition"
              >
                {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* Change Password */}
        <section className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-white">Change Password</h2>
          </div>

          {passwordMsg && (
            <div className={`mb-4 p-3 rounded-lg text-xs border ${passwordMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border text-sm text-white focus:outline-none transition ${confirmPassword && confirmPassword !== newPassword ? "border-rose-500" : "border-slate-800 focus:border-emerald-500"}`}
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition"
              >
                {passwordSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </section>

        {/* Active Sessions */}
        <section className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Active Sessions</h2>
              <p className="text-[11px] text-slate-500">Revoke any session you don&apos;t recognise.</p>
            </div>
          </div>
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500">No active sessions found.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.sessionId} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                  s.isCurrent ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-950/60 border-slate-800"
                }`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-slate-200 truncate">{s.userAgent || "Unknown device"}</p>
                      {s.isCurrent && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Current</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {s.ip || "Unknown IP"} · Last active {new Date(s.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                  {!s.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(s.sessionId)}
                      disabled={revokingSession === s.sessionId}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium transition disabled:opacity-50"
                    >
                      {revokingSession === s.sessionId ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Audit Log */}
        <section className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Security Activity</h2>
              <p className="text-[11px] text-slate-500">Last 90 days of account actions.</p>
            </div>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500">No activity recorded yet.</p>
          ) : (
            <>
              <div className="space-y-1">
                {auditLogs.map((log) => (
                  <div key={log._id} className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 capitalize">{log.action.replace(/_/g, " ")}</p>
                        {log.detail && <p className="text-[11px] text-slate-500 truncate">{log.detail}</p>}
                        {log.ip && <p className="text-[11px] text-slate-600">{log.ip}</p>}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 shrink-0">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              {auditTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => { const p = Math.max(1, auditPage - 1); setAuditPage(p); fetchAuditLog(p); }} disabled={auditPage === 1} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition">← Prev</button>
                  <span className="text-xs text-slate-400">Page {auditPage} of {auditTotalPages}</span>
                  <button onClick={() => { const p = Math.min(auditTotalPages, auditPage + 1); setAuditPage(p); fetchAuditLog(p); }} disabled={auditPage === auditTotalPages} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition">Next →</button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Danger Zone */}
        <section className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />Delete Account
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Permanently delete your account and all data. A 30-day grace period applies before data is purged.</p>
            </div>
            <button
              onClick={() => { setShowDeleteModal(true); setDeletePassword(""); setDeleteError(""); }}
              className="shrink-0 px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              Delete Account
            </button>
          </div>
        </section>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/30 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Delete your account</h2>
            <p className="text-xs text-slate-400 mb-4">This will immediately revoke all your API keys and projects. Your account data will be permanently purged after 30 days. This cannot be undone.</p>
            {deleteError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{deleteError}</div>
            )}
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm your password</label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition">Cancel</button>
                <button type="submit" disabled={deleteLoading} className="flex-1 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition">
                  {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
