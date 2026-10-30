"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Users,
  Layers,
  Mail,
  Loader2,
  CheckCircle2,
  Ban,
  Snowflake,
  Lock,
  Unlock,
  Trash2,
  KeyRound,
  UserPlus,
  Heart,
  Plus,
  Activity,
  LogOut,
  ExternalLink,
  Search,
  Save,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import MobileNav from "@/components/MobileNav";

interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  isFrozen: boolean;
  isLocked: boolean;
  lockReason?: string;
  isEmailVerified: boolean;
  plan: "free" | "pro" | "enterprise";
  allowMultipleProjects: boolean;
  maxProjects: number;
  dailyQuota: number;
  projectCount: number;
  sentToday: number;
  totalSent: number;
  createdAt: string;
}

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

export default function AdminControlPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "users" | "admins" | "support" | "oversight"
  >("users");

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  // Controlled draft values for maxProjects and dailyQuota per user ID
  const [limitDrafts, setLimitDrafts] = useState<
    Record<string, { maxProjects: number; dailyQuota: number }>
  >({});

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Create Admin Form State
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Password Reset Modal State
  const [resetTargetUser, setResetTargetUser] = useState<AdminUserRow | null>(null);
  const [newUserPassword, setNewUserPassword] = useState("");

  // Support & System Mailer Settings State
  const [isSupportEnabled, setIsSupportEnabled] = useState(true);
  const [supportTitle, setSupportTitle] = useState("");
  const [supportSubtitle, setSupportSubtitle] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [systemGmailUser, setSystemGmailUser] = useState("");
  const [systemAppPassword, setSystemAppPassword] = useState("");
  const [systemFromName, setSystemFromName] = useState("SafeMailNode Security");
  const [hasSystemPassword, setHasSystemPassword] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Platform Projects & Logs Oversight
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);

  // Migration
  const [migrating, setMigrating] = useState(false);
  const [migrateResults, setMigrateResults] = useState<{ projectId: string; name: string; rawApiKey: string }[] | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users?t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        const drafts: Record<string, { maxProjects: number; dailyQuota: number }> = {};
        for (const u of data.data) {
          drafts[u._id] = {
            maxProjects: Number(u.maxProjects ?? 2),
            dailyQuota: Number(u.dailyQuota ?? 100),
          };
        }
        setLimitDrafts(drafts);
      }

      const [supRes, projRes, logsRes] = await Promise.all([
        fetch(`/api/support?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/admin/projects?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/admin/logs?t=${Date.now()}`, { cache: "no-store" }),
      ]);

      const supJson = await supRes.json();
      if (supJson.success && supJson.data) {
        const s = supJson.data;
        setIsSupportEnabled(Boolean(s.isSupportEnabled));
        setSupportTitle(s.supportTitle || "");
        setSupportSubtitle(s.supportSubtitle || "");
        setSupportMessage(s.supportMessage || "");
        setContactEmail(s.contactEmail || "");
        setBankAccounts(s.bankAccounts || []);
        setCryptoWallets(s.cryptoWallets || []);
        setPaymentLinks(s.paymentLinks || []);
        setSystemGmailUser(s.systemGmailUser || "");
        setSystemFromName(s.systemFromName || "SafeMailNode Security");
        setHasSystemPassword(Boolean(s.hasSystemPassword));
      }

      const projJson = await projRes.json();
      if (projJson.success) setAllProjects(projJson.data);

      const logsJson = await logsRes.json();
      if (logsJson.success) setAllLogs(logsJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const updateUserField = async (userId: string, patch: Record<string, any>, msg?: string) => {
    setUpdatingId(userId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.message || "Update failed" });
      } else {
        setFeedback({ type: "success", text: msg || "Updated user settings." });
        await fetchAdminData();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveUserLimits = async (u: AdminUserRow) => {
    const draft = limitDrafts[u._id];
    if (!draft) return;
    await updateUserField(
      u._id,
      {
        maxProjects: Number(draft.maxProjects),
        dailyQuota: Number(draft.dailyQuota),
      },
      `Saved limits for ${u.email}: ${draft.maxProjects} Projects • ${draft.dailyQuota} Daily Emails`
    );
  };

  const handleDeleteUser = async (u: AdminUserRow) => {
    if (
      !confirm(
        `Permanently DELETE user "${u.name}" (${u.email}) and all ${u.projectCount} of their projects & logs? This cannot be undone.`
      )
    ) {
      return;
    }
    setUpdatingId(u._id);
    try {
      const res = await fetch(`/api/admin/users/${u._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.message || "Failed to delete user" });
      } else {
        setFeedback({ type: "success", text: data.message });
        await fetchAdminData();
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || newUserPassword.length < 6) return;
    await updateUserField(
      resetTargetUser._id,
      { newPassword: newUserPassword },
      `Password reset and account unlocked for ${resetTargetUser.email}`
    );
    setResetTargetUser(null);
    setNewUserPassword("");
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.message || "Failed to create admin" });
      } else {
        setFeedback({ type: "success", text: data.message });
        setAdminName("");
        setAdminEmail("");
        setAdminPassword("");
        await fetchAdminData();
      }
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleSaveSupportAndSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSupportEnabled,
          supportTitle,
          supportSubtitle,
          supportMessage,
          contactEmail,
          bankAccounts,
          cryptoWallets,
          paymentLinks,
          systemGmailUser,
          systemAppPassword: systemAppPassword || undefined,
          systemFromName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.message || "Failed to save settings" });
      } else {
        setFeedback({
          type: "success",
          text: "Saved Support Our Project page & System Mailer settings!",
        });
        setSystemAppPassword("");
        await fetchAdminData();
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleProjectAdmin = async (projectId: string, isActive: boolean) => {
    await fetch("/api/admin/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, isActive }),
    });
    fetchAdminData();
  };

  const handleDeleteProjectAdmin = async (projectId: string, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;
    await fetch(`/api/admin/projects?projectId=${projectId}`, { method: "DELETE" });
    fetchAdminData();
  };

  const handleMigrateProjects = async () => {
    setMigrating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/migrate-projects", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.message || "Migration failed" });
      } else if (data.migrated.length === 0) {
        setFeedback({ type: "success", text: "No legacy projects found — all projects are up to date." });
      } else {
        setMigrateResults(data.migrated);
        await fetchAdminData();
      }
    } finally {
      setMigrating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-amber-400" />
        Loading SafeMailNode Admin Portal...
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminUsers = users.filter((u) => u.role === "admin");

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/admin" badge="ADMIN PORTAL" badgeVariant="amber" />
          <div className="flex items-center gap-2">
            <Link href="/support" target="_blank" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-medium hover:bg-pink-500/20">
              <Heart className="w-3.5 h-3.5" />Support<ExternalLink className="w-3 h-3" />
            </Link>
            <button onClick={handleLogout} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300">
              <LogOut className="w-3.5 h-3.5" />Sign Out
            </button>
            <MobileNav items={[
              { label: "Support", href: "/support", icon: <Heart className="w-4 h-4 text-pink-400" />, variant: "pink", external: true },
              { label: "Sign Out", onClick: handleLogout, icon: <LogOut className="w-4 h-4" />, variant: "danger" },
            ]} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Top Metrics */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <Users className="w-8 h-8 text-amber-400" />
            <div>
              <div className="text-xs text-slate-400">Total Users</div>
              <div className="text-2xl font-bold">{users.length}</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <Layers className="w-8 h-8 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-400">Active Projects</div>
              <div className="text-2xl font-bold">{allProjects.length}</div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <Mail className="w-8 h-8 text-sky-400" />
            <div>
              <div className="text-xs text-slate-400">Emails Dispatched</div>
              <div className="text-2xl font-bold">
                {users.reduce((acc, u) => acc + u.totalSent, 0)}
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <Shield className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-xs text-slate-400">Administrators</div>
              <div className="text-2xl font-bold">{adminUsers.length}</div>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveTab("users")}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
              activeTab === "users"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users, Limits &amp; Account Controls</span>
            <span className="sm:hidden">Users</span>
            ({users.length})
          </button>

          <button
            onClick={() => setActiveTab("admins")}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
              activeTab === "admins"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Admins ({adminUsers.length})
          </button>

          <button
            onClick={() => setActiveTab("support")}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
              activeTab === "support"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Support &amp; Mailer</span>
            <span className="sm:hidden">Support</span>
          </button>

          <button
            onClick={() => setActiveTab("oversight")}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition ${
              activeTab === "oversight"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            Oversight
          </button>
        </div>

        {/* TAB 1: USERS & QUOTAS & ACCOUNT CONTROLS */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="text-xs text-slate-400">
                Default New User Limits: <strong>2 Projects</strong> •{" "}
                <strong>100 Daily Emails</strong> (Change numbers and click{" "}
                <strong className="text-amber-400">Save</strong>)
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
                      <th className="py-3.5 px-4">User &amp; Verification</th>
                      <th className="py-3.5 px-4">Plan</th>
                      <th className="py-3.5 px-4">Projects &amp; Daily Mail Limits</th>
                      <th className="py-3.5 px-4">Usage (Today / All)</th>
                      <th className="py-3.5 px-4">Security &amp; Account Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredUsers.map((u) => {
                      const draft = limitDrafts[u._id] || {
                        maxProjects: u.maxProjects ?? 2,
                        dailyQuota: u.dailyQuota ?? 100,
                      };
                      const isDirty =
                        Number(draft.maxProjects) !== Number(u.maxProjects) ||
                        Number(draft.dailyQuota) !== Number(u.dailyQuota);

                      return (
                        <tr key={u._id} className="hover:bg-slate-900/40">
                          {/* User + Email Verification */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                              {u.name}
                              {u.role === "admin" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 mb-1.5">{u.email}</div>
                            <button
                              disabled={updatingId === u._id}
                              onClick={() =>
                                updateUserField(
                                  u._id,
                                  { isEmailVerified: !u.isEmailVerified },
                                  `Email verification updated for ${u.email}`
                                )
                              }
                              className={`text-[11px] px-2 py-0.5 rounded border transition ${
                                u.isEmailVerified
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              }`}
                            >
                              {u.isEmailVerified
                                ? "✓ Email Verified"
                                : "⚠ Unverified (Click to Verify)"}
                            </button>
                          </td>

                          {/* Plan */}
                          <td className="py-3.5 px-4">
                            <select
                              value={u.plan}
                              disabled={updatingId === u._id}
                              onChange={(e) =>
                                updateUserField(
                                  u._id,
                                  { plan: e.target.value },
                                  `Updated plan to ${e.target.value.toUpperCase()} for ${u.email}`
                                )
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white uppercase font-semibold"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </td>

                          {/* Projects Limit & Daily Mail Limit + Save Button */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <div>
                                <div className="text-[10px] text-slate-400 mb-0.5">
                                  Projects ({u.projectCount} used)
                                </div>
                                <input
                                  type="number"
                                  min={1}
                                  max={500}
                                  value={draft.maxProjects}
                                  disabled={updatingId === u._id}
                                  onChange={(e) =>
                                    setLimitDrafts((prev) => ({
                                      ...prev,
                                      [u._id]: {
                                        ...draft,
                                        maxProjects: parseInt(e.target.value || "1", 10),
                                      },
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveUserLimits(u);
                                  }}
                                  className="w-20 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white font-semibold focus:border-amber-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <div className="text-[10px] text-slate-400 mb-0.5">
                                  Daily Emails
                                </div>
                                <input
                                  type="number"
                                  min={0}
                                  step={10}
                                  value={draft.dailyQuota}
                                  disabled={updatingId === u._id}
                                  onChange={(e) =>
                                    setLimitDrafts((prev) => ({
                                      ...prev,
                                      [u._id]: {
                                        ...draft,
                                        dailyQuota: parseInt(e.target.value || "0", 10),
                                      },
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveUserLimits(u);
                                  }}
                                  className="w-24 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white font-semibold focus:border-amber-500 focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                disabled={updatingId === u._id}
                                onClick={() => handleSaveUserLimits(u)}
                                className={`mt-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                  isDirty
                                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                              >
                                <Save className="w-3.5 h-3.5" />
                                Save
                              </button>
                            </div>
                          </td>

                          {/* Usage */}
                          <td className="py-3.5 px-4 text-slate-300">
                            <span className="text-emerald-400 font-semibold">{u.sentToday}</span>{" "}
                            today • <span>{u.totalSent}</span> total
                          </td>

                          {/* Security & Account Actions: Freeze, Lock, Suspend, Reset Password, Delete */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Freeze / Unfreeze */}
                              <button
                                disabled={updatingId === u._id}
                                onClick={() =>
                                  updateUserField(
                                    u._id,
                                    { isFrozen: !u.isFrozen },
                                    `${!u.isFrozen ? "Froze" : "Unfroze"} account ${u.email}`
                                  )
                                }
                                title="Freeze pauses outgoing emails while allowing dashboard login"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium border transition ${
                                  u.isFrozen
                                    ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-sky-300"
                                }`}
                              >
                                <Snowflake className="w-3.5 h-3.5" />
                                {u.isFrozen ? "Frozen" : "Freeze"}
                              </button>

                              {/* Lock / Unlock */}
                              <button
                                disabled={updatingId === u._id}
                                onClick={() =>
                                  updateUserField(
                                    u._id,
                                    { isLocked: !u.isLocked },
                                    `${!u.isLocked ? "Locked" : "Unlocked"} account ${u.email}`
                                  )
                                }
                                title={
                                  u.lockReason || "Lock blocks both login and API key access"
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium border transition ${
                                  u.isLocked
                                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-300"
                                }`}
                              >
                                {u.isLocked ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    Locked
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5" />
                                    Lock
                                  </>
                                )}
                              </button>

                              {/* Suspend / Activate */}
                              <button
                                disabled={updatingId === u._id}
                                onClick={() =>
                                  updateUserField(
                                    u._id,
                                    { isActive: !u.isActive },
                                    `${!u.isActive ? "Activated" : "Suspended"} ${u.email}`
                                  )
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium border transition ${
                                  u.isActive
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                    : "bg-rose-500/20 border-rose-500/40 text-rose-300"
                                }`}
                              >
                                {u.isActive ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3.5 h-3.5" />
                                    Suspended
                                  </>
                                )}
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  setResetTargetUser(u);
                                  setNewUserPassword("");
                                }}
                                title="Reset user password"
                                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete User */}
                              <button
                                disabled={updatingId === u._id}
                                onClick={() => handleDeleteUser(u)}
                                title="Permanently delete user and all projects"
                                className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADMINS MANAGEMENT */}
        {activeTab === "admins" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                Create Additional Administrator
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Since the public one-time admin registration is locked, new administrators can only
                be provisioned here.
              </p>

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin2@yourdomain.com"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password (min. 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs inline-flex items-center gap-2"
                >
                  {creatingAdmin && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Administrator Account
                </button>
              </form>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h2 className="text-lg font-bold mb-4">Active Platform Administrators</h2>
              <div className="space-y-3">
                {adminUsers.map((adm) => (
                  <div
                    key={adm._id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">{adm.name}</div>
                      <div className="text-xs text-slate-400">{adm.email}</div>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 font-semibold uppercase">
                      Admin
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SUPPORT OUR PROJECT & SYSTEM MAILER SETTINGS */}
        {activeTab === "support" && (
          <form onSubmit={handleSaveSupportAndSystemSettings} className="space-y-8">
            {/* System Mailer Config */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-emerald-500/30 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  System Verification Mailer (For User Registration Codes)
                </h2>
                <p className="text-xs text-slate-400">
                  Configure the Gmail account used by SafeMailNode to send 6-digit email
                  verification codes to new users upon registration.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">System Gmail Address</label>
                  <input
                    type="email"
                    value={systemGmailUser}
                    onChange={(e) => setSystemGmailUser(e.target.value)}
                    placeholder="noreply@gmail.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    System Google App Password{" "}
                    {hasSystemPassword ? "(Saved — leave blank to keep)" : ""}
                  </label>
                  <input
                    type="password"
                    value={systemAppPassword}
                    onChange={(e) => setSystemAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">System Sender Name</label>
                  <input
                    type="text"
                    value={systemFromName}
                    onChange={(e) => setSystemFromName(e.target.value)}
                    placeholder="SafeMailNode Security"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Support Our Project Page Editor */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    &quot;Support Our Project&quot; Page Configuration (/support)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Provide bank accounts, crypto wallets, and donation links for users who want to
                    support the project.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSupportEnabled}
                    onChange={(e) => setIsSupportEnabled(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  Enable Support Page Publicly
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Page Title</label>
                  <input
                    type="text"
                    value={supportTitle}
                    onChange={(e) => setSupportTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Contact / Sponsorship Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="support@yourdomain.com"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={supportSubtitle}
                  onChange={(e) => setSupportSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Additional Message</label>
                <textarea
                  rows={2}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              {/* Bank Accounts Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-300">
                    Bank Transfer Accounts
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setBankAccounts([
                        ...bankAccounts,
                        {
                          bankName: "",
                          accountName: "",
                          accountNumber: "",
                          currency: "NGN",
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bank Account
                  </button>
                </div>

                {bankAccounts.map((bank, idx) => (
                  <div
                    key={idx}
                    className="grid sm:grid-cols-5 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={bank.bankName}
                      onChange={(e) => {
                        const copy = [...bankAccounts];
                        copy[idx] = { ...copy[idx], bankName: e.target.value };
                        setBankAccounts(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Account Name"
                      value={bank.accountName}
                      onChange={(e) => {
                        const copy = [...bankAccounts];
                        copy[idx] = { ...copy[idx], accountName: e.target.value };
                        setBankAccounts(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={bank.accountNumber}
                      onChange={(e) => {
                        const copy = [...bankAccounts];
                        copy[idx] = { ...copy[idx], accountNumber: e.target.value };
                        setBankAccounts(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Currency (e.g. NGN, USD)"
                      value={bank.currency || ""}
                      onChange={(e) => {
                        const copy = [...bankAccounts];
                        copy[idx] = { ...copy[idx], currency: e.target.value };
                        setBankAccounts(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBankAccounts(bankAccounts.filter((_, i) => i !== idx))
                      }
                      className="px-2.5 py-1.5 rounded bg-rose-500/10 text-rose-400 text-xs hover:bg-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Crypto Wallets Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-300">
                    Crypto Support Wallets
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCryptoWallets([
                        ...cryptoWallets,
                        { coin: "USDT", network: "TRC20", walletAddress: "" },
                      ])
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-amber-400"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Crypto Wallet
                  </button>
                </div>

                {cryptoWallets.map((w, idx) => (
                  <div
                    key={idx}
                    className="grid sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Coin (e.g. USDT, BTC)"
                      value={w.coin}
                      onChange={(e) => {
                        const copy = [...cryptoWallets];
                        copy[idx] = { ...copy[idx], coin: e.target.value };
                        setCryptoWallets(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Network (e.g. TRC20, ERC20)"
                      value={w.network}
                      onChange={(e) => {
                        const copy = [...cryptoWallets];
                        copy[idx] = { ...copy[idx], network: e.target.value };
                        setCryptoWallets(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Wallet Address"
                      value={w.walletAddress}
                      onChange={(e) => {
                        const copy = [...cryptoWallets];
                        copy[idx] = { ...copy[idx], walletAddress: e.target.value };
                        setCryptoWallets(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCryptoWallets(cryptoWallets.filter((_, i) => i !== idx))
                      }
                      className="px-2.5 py-1.5 rounded bg-rose-500/10 text-rose-400 text-xs hover:bg-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Payment Links Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-300">
                    External Payment / Donation Links (Paystack, BuyMeACoffee, etc.)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentLinks([
                        ...paymentLinks,
                        { label: "", url: "", description: "" },
                      ])
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-sky-400"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Payment Link
                  </button>
                </div>

                {paymentLinks.map((lnk, idx) => (
                  <div
                    key={idx}
                    className="grid sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Label (e.g. Buy Me a Coffee)"
                      value={lnk.label}
                      onChange={(e) => {
                        const copy = [...paymentLinks];
                        copy[idx] = { ...copy[idx], label: e.target.value };
                        setPaymentLinks(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={lnk.url}
                      onChange={(e) => {
                        const copy = [...paymentLinks];
                        copy[idx] = { ...copy[idx], url: e.target.value };
                        setPaymentLinks(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Short description"
                      value={lnk.description || ""}
                      onChange={(e) => {
                        const copy = [...paymentLinks];
                        copy[idx] = { ...copy[idx], description: e.target.value };
                        setPaymentLinks(copy);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentLinks(paymentLinks.filter((_, i) => i !== idx))
                      }
                      className="px-2.5 py-1.5 rounded bg-rose-500/10 text-rose-400 text-xs hover:bg-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs inline-flex items-center gap-2"
                >
                  {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save All Support &amp; System Mailer Settings
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: PLATFORM PROJECTS & LOGS OVERSIGHT */}
        {activeTab === "oversight" && (
          <div className="space-y-8">
            {/* Legacy Migration Banner */}
            {allProjects.some((p) => !p.apiKeyPrefix) && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-amber-300">Legacy projects detected</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {allProjects.filter((p) => !p.apiKeyPrefix).length} project(s) are missing API keys and cannot send emails. Run migration to generate new keys.
                  </p>
                </div>
                <button
                  onClick={handleMigrateProjects}
                  disabled={migrating}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition"
                >
                  {migrating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Migrate Legacy Projects
                </button>
              </div>
            )}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 font-bold text-sm">
                All User Gmail Configurations ({allProjects.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Owner</th>
                      <th className="py-3 px-4">Gmail Account</th>
                      <th className="py-3 px-4">Sent / Failed</th>
                      <th className="py-3 px-4">Status / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {allProjects.map((p) => (
                      <tr key={p._id}>
                        <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {p.userId?.email || "Unknown"}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400">{p.gmailUser}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {p.totalSent} sent • {p.totalFailed} failed
                        </td>
                        <td className="py-3 px-4 flex items-center gap-2">
                          <button
                            onClick={() => handleToggleProjectAdmin(p._id, !p.isActive)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                              p.isActive
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-rose-500/15 text-rose-300"
                            }`}
                          >
                            {p.isActive ? "Active (Click to Pause)" : "Paused (Click to Enable)"}
                          </button>
                          <button
                            onClick={() => handleDeleteProjectAdmin(p._id, p.name)}
                            className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 font-bold text-sm">
                Recent Platform Email Logs ({allLogs.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase">
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {allLogs.map((l) => (
                      <tr key={l._id}>
                        <td className="py-2.5 px-4">
                          <span
                            className={
                              l.status === "sent" ? "text-emerald-400" : "text-rose-400"
                            }
                          >
                            {l.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          {l.userId?.email || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{l.projectName}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-200">{l.to}</td>
                        <td className="py-2.5 px-4 text-slate-300">{l.subject}</td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Migration Results Modal */}
      {migrateResults && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Migration Complete — Save These Keys</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {migrateResults.length} project(s) migrated. Raw keys shown once — copy and send to each user.
                </p>
              </div>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto mb-4">
              {migrateResults.map((r) => (
                <div key={r.projectId} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-300 mb-1">{r.name}</div>
                  <code className="text-xs font-mono text-amber-400 break-all select-all">{r.rawApiKey}</code>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-400/80 mb-4">
              ⚠ Users must also re-edit their project and re-enter their Gmail App Password to restore full functionality.
            </p>
            <button
              onClick={() => setMigrateResults(null)}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition"
            >
              I&apos;ve copied all keys
            </button>
          </div>
        </div>
      )}

      {/* Reset User Password Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <h3 className="text-lg font-bold mb-1">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Set a new password for <strong>{resetTargetUser.email}</strong> (also unlocks their
              account).
            </p>
            <form onSubmit={handleResetUserPassword} className="space-y-4">
              <input
                type="password"
                required
                minLength={6}
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="New password (min. 6 characters)"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
