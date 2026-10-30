"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Send,
  Trash2,
  Edit3,
  LogOut,
  Code2,
  Activity,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  HelpCircle,
  Heart,
  Snowflake,
  BookOpen,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  plan: "free" | "pro" | "enterprise";
  isFrozen: boolean;
  isEmailVerified: boolean;
  allowMultipleProjects: boolean;
  maxProjects: number;
  dailyQuota: number;
  sentToday: number;
}

interface MailProject {
  _id: string;
  name: string;
  gmailUser: string;
  defaultFromName: string;
  defaultReplyTo?: string;
  apiKeyPrefix: string;
  isActive: boolean;
  isRevoked: boolean;
  totalSent: number;
  totalFailed: number;
  lastUsedAt?: string;
  createdAt: string;
}

interface EmailLogItem {
  _id: string;
  projectName: string;
  gmailUser: string;
  fromName: string;
  to: string;
  subject: string;
  status: "sent" | "failed";
  messageId?: string;
  errorMessage?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [projects, setProjects] = useState<MailProject[]>([]);
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "logs" | "integrate">("projects");
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const LOGS_LIMIT = 20;

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal state for creating / editing a project
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<MailProject | null>(null);
  const [formName, setFormName] = useState("");
  const [formGmail, setFormGmail] = useState("");
  const [formAppPassword, setFormAppPassword] = useState("");
  const [formFromName, setFormFromName] = useState("");
  const [formReplyTo, setFormReplyTo] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Test email state
  const [testingProjectId, setTestingProjectId] = useState<string | null>(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [selectedSnippetProject, setSelectedSnippetProject] = useState<MailProject | null>(null);

  // Show-once API key modal (after create or regenerate)
  const [revealedKey, setRevealedKey] = useState<{ projectName: string; rawKey: string } | null>(null);
  const [revealKeyCopied, setRevealKeyCopied] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const meRes = await fetch(`/api/auth/me?t=${Date.now()}`, { cache: "no-store" });
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meJson = await meRes.json();
      if (!meJson.data.isEmailVerified) {
        router.push("/verify-email");
        return;
      }

      setUser(meJson.data);
      setTestRecipient((prev) => prev || meJson.data.email);

      const [projRes, logsRes] = await Promise.all([
        fetch(`/api/projects?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/logs?page=${logsPage}&limit=${LOGS_LIMIT}&t=${Date.now()}`, { cache: "no-store" }),
      ]);
      const projJson = await projRes.json();
      const logsJson = await logsRes.json();

      if (projJson.success) {
        setProjects(projJson.data);
        if (projJson.data.length > 0 && !selectedSnippetProject) {
          setSelectedSnippetProject(projJson.data[0]);
        }
      }
      if (logsJson.success) {
        setLogs(logsJson.data);
        setLogsTotalPages(logsJson.pagination?.totalPages ?? 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router, selectedSnippetProject, logsPage]);

  useEffect(() => {
    fetchDashboardData();
    const onFocus = () => fetchDashboardData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchDashboardData]);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormName("");
    setFormGmail("");
    setFormAppPassword("");
    setFormFromName("");
    setFormReplyTo("");
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (project: MailProject) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormGmail(project.gmailUser);
    setFormAppPassword("");
    setFormFromName(project.defaultFromName);
    setFormReplyTo(project.defaultReplyTo || "");
    setFormError("");
    setShowModal(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const url = editingProject ? `/api/projects/${editingProject._id}` : "/api/projects";
      const method = editingProject ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          gmailUser: formGmail,
          appPassword: formAppPassword || undefined,
          defaultFromName: formFromName || formName,
          defaultReplyTo: formReplyTo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to save configuration");
        setSaving(false);
        return;
      }
      setShowModal(false);
      if (!editingProject && data.data?.rawApiKey) {
        setRevealedKey({ projectName: data.data.name, rawKey: data.data.rawApiKey });
      } else {
        setFeedback({
          type: "success",
          text: `Updated "${data.data.name}" Gmail configuration.`,
        });
      }
      await fetchDashboardData();
    } catch (err: any) {
      setFormError(err?.message || "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateKey = async (project: MailProject) => {
    if (
      !confirm(
        `Regenerate API key for "${project.name}"? Any apps using the old key will stop working until updated.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/projects/${project._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateKey: true }),
    });
    const data = await res.json();
    if (data.success) {
      if (data.newRawApiKey) {
        setRevealedKey({ projectName: project.name, rawKey: data.newRawApiKey });
      } else {
        setFeedback({ type: "success", text: `Regenerated API key for "${project.name}".` });
      }
      fetchDashboardData();
    }
  };

  const handleDeleteProject = async (project: MailProject) => {
    if (!confirm(`Delete Gmail configuration "${project.name}"?`)) return;
    const res = await fetch(`/api/projects/${project._id}`, { method: "DELETE" });
    if (res.ok) {
      setFeedback({ type: "success", text: `Deleted "${project.name}".` });
      fetchDashboardData();
    }
  };

  const handleSendTestEmail = async (projectId: string) => {
    setTestSending(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testRecipient }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.message || "Failed to send test email" });
      } else {
        setFeedback({ type: "success", text: data.message });
        setTestingProjectId(null);
      }
      fetchDashboardData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Failed to send test email" });
    } finally {
      setTestSending(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
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
    } catch (err: any) {
      setDeleteError(err?.message || "Network error.");
      setDeleteLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-emerald-400" />
        Loading your workspace...
      </div>
    );
  }

  const effectiveMaxProjects = Math.max(Number(user.maxProjects ?? 2), 1);
  const effectiveDailyQuota = Number(user.dailyQuota ?? 100);
  const canCreateMore = !user.isFrozen && projects.length < effectiveMaxProjects;
  const originUrl =
    typeof window !== "undefined" ? window.location.origin : "https://safemailnode.vercel.app";

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" badge={user.plan.toUpperCase()} />
          <div className="flex items-center gap-2">
            <Link href="/docs" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />Docs
            </Link>
            <Link href="/support" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold hover:bg-pink-500/20 transition">
              <Heart className="w-3.5 h-3.5" />Support
            </Link>
            <span className="text-xs text-slate-400 hidden md:inline">{user.email}</span>
            <button onClick={handleLogout} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition">
              <LogOut className="w-3.5 h-3.5" />Sign Out
            </button>
            <MobileNav items={[
              { label: "Docs", href: "/docs", icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
              { label: "Support", href: "/support", icon: <Heart className="w-4 h-4 text-pink-400" />, variant: "pink" },
              { label: "Sign Out", onClick: handleLogout, icon: <LogOut className="w-4 h-4" />, variant: "danger" },
            ]} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Frozen Account Notice */}
        {user.isFrozen && (
          <div className="mb-6 p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200 flex items-center gap-3 text-sm">
            <Snowflake className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <strong>Your account is currently frozen.</strong> Outgoing email delivery and new
              project creation are temporarily paused by an administrator.
            </div>
          </div>
        )}

        {/* Quota Summary Bar */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Gmail / Project Limit</div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {projects.length} / {effectiveMaxProjects}
              </span>
              <span className="text-xs text-emerald-400">
                {Math.max(effectiveMaxProjects - projects.length, 0)} slot(s) remaining
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Daily Email Limit (UTC)</div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {user.sentToday} / {effectiveDailyQuota}
              </span>
              <span className="text-xs text-emerald-400">
                {Math.max(effectiveDailyQuota - user.sentToday, 0)} remaining today
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Total Emails Dispatched</div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {projects.reduce((acc, p) => acc + p.totalSent, 0)}
              </span>
              <span className="text-xs text-slate-400">
                {projects.reduce((acc, p) => acc + p.totalFailed, 0)} failed
              </span>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-xs underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("projects")}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "projects"
                  ? "bg-emerald-500 text-slate-950 font-semibold"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Configurations ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab("integrate")}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition ${
                activeTab === "integrate"
                  ? "bg-emerald-500 text-slate-950 font-semibold"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Code2 className="w-4 h-4" />Integrate
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition ${
                activeTab === "logs"
                  ? "bg-emerald-500 text-slate-950 font-semibold"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Activity className="w-4 h-4" />Logs ({logs.length})
            </button>
          </div>

          {canCreateMore ? (
            <button
              onClick={openCreateModal}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Gmail Config
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              {user.isFrozen
                ? "Account frozen"
                : `Limit (${effectiveMaxProjects}) reached`}
            </div>
          )}
        </div>

        {/* TAB 1: PROJECTS */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
                <Mail className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-1">No Gmail configuration yet</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                  Connect your Gmail address and 16-character Google App Password to generate your{" "}
                  <code className="text-emerald-400">x-api-key</code> for sending emails.
                </p>
                {!user.isFrozen && (
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    Configure Gmail Now
                  </button>
                )}
              </div>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj._id}
                  className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-white">{proj.name}</h3>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            proj.isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {proj.isActive ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Gmail: <span className="text-slate-200 font-mono">{proj.gmailUser}</span> •
                        Default Sender:{" "}
                        <span className="text-slate-200">&quot;{proj.defaultFromName}&quot;</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        disabled={user.isFrozen}
                        onClick={() =>
                          setTestingProjectId(testingProjectId === proj._id ? null : proj._id)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Test Email
                      </button>
                      <button
                        onClick={() => openEditModal(proj)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Gmail
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* API Key Bar */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        x-api-key:
                      </span>
                      {proj.isRevoked ? (
                        <span className="text-xs font-mono text-rose-400 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> REVOKED — regenerate to issue a new key
                        </span>
                      ) : (
                        <code className="text-xs sm:text-sm font-mono text-emerald-400">
                          {proj.apiKeyPrefix}<span className="text-slate-500">••••••••••••••••••••••••••••••••</span>
                        </code>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRegenerateKey(proj)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
                        title="Regenerate API Key — new key shown once"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Regenerate Key
                      </button>
                    </div>
                  </div>

                  {/* Test Email Drawer */}
                  {testingProjectId === proj._id && (
                    <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/30 flex flex-wrap items-center gap-3">
                      <input
                        type="email"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                        placeholder="Recipient email address"
                        className="flex-1 min-w-[220px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white"
                      />
                      <button
                        onClick={() => handleSendTestEmail(proj._id)}
                        disabled={testSending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition"
                      >
                        {testSending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        Dispatch Test Email
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>
                      Sent: <strong className="text-slate-300">{proj.totalSent}</strong> • Failed:{" "}
                      <strong className="text-slate-300">{proj.totalFailed}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSnippetProject(proj);
                        setActiveTab("integrate");
                      }}
                      className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      View Integration Code for {proj.name}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: INTEGRATION SNIPPETS */}
        {activeTab === "integrate" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 className="text-lg font-bold mb-2">
                Integrate into Your Projects (Express, Next.js, or Any Backend)
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Send a <code className="text-emerald-400">POST</code> request to{" "}
                <code className="text-emerald-400">{originUrl}/api/send-email</code> with your
                project&apos;s <code className="text-emerald-400">x-api-key</code> header.
              </p>

              {projects.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-slate-400 mr-2">Select Project Key:</label>
                  <select
                    value={selectedSnippetProject?._id || projects[0]._id}
                    onChange={(e) => {
                      const found = projects.find((p) => p._id === e.target.value);
                      if (found) setSelectedSnippetProject(found);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.gmailUser})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    1. Environment Variables (.env in your project)
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">
{`MAIL_SERVICE_URL=${originUrl}
MAIL_SERVICE_API_KEY=ms_live_your_project_api_key  # copied from the reveal modal on creation`}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    2. Drop-in email.service.ts Helper (Node.js / Express / Next.js)
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`export const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch(\`\${process.env.MAIL_SERVICE_URL}/api/send-email\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.MAIL_SERVICE_API_KEY as string,
    },
    body: JSON.stringify({
      to,
      subject,
      html,
      fromName: "${selectedSnippetProject?.defaultFromName || "Acme Cloud"}",
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to send email");
  }
  return result;
};`}
                  </pre>
                </div>

                <div className="pt-2">
                  <Link
                    href="/docs"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    View Full Production Architecture &amp; Template Documentation &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMAIL LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">
                No emails sent yet. Use the &quot;Send Test Email&quot; button on your project to
                test delivery!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-xs text-slate-400 uppercase">
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Project</th>
                      <th className="py-3.5 px-4">Recipient</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4">
                          {log.status === "sent" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Sent
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium"
                              title={log.errorMessage}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300">{log.projectName}</td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-200">{log.to}</td>
                        <td className="py-3 px-4 text-xs text-slate-300">
                          <div>{log.subject}</div>
                          {log.errorMessage && (
                            <div className="text-[11px] text-rose-400 mt-0.5">
                              {log.errorMessage}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
            {logsTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={logsPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
                >
                  ← Prev
                </button>
                <span className="text-xs text-slate-400">Page {logsPage} of {logsTotalPages}</span>
                <button
                  onClick={() => setLogsPage((p) => Math.min(logsTotalPages, p + 1))}
                  disabled={logsPage === logsTotalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create / Edit Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-1">
              {editingProject ? "Update Gmail Configuration" : "Add Gmail / Project Configuration"}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Enter the Gmail account and 16-character Google App Password to use with Nodemailer.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Acme Production App"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Gmail Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formGmail}
                    onChange={(e) => setFormGmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Default Sender Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formFromName}
                    onChange={(e) => setFormFromName(e.target.value)}
                    placeholder="Acme Cloud"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Google 16-Character App Password{" "}
                  {editingProject ? "(leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingProject}
                  value={formAppPassword}
                  onChange={(e) => setFormAppPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                />
                <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Generate this in{" "}
                    <strong className="text-slate-300">
                      Google Account → Security → 2-Step Verification → App passwords
                    </strong>
                    . Spaces are stripped automatically.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Reply-To Email (Optional)
                </label>
                <input
                  type="email"
                  value={formReplyTo}
                  onChange={(e) => setFormReplyTo(e.target.value)}
                  placeholder="support@yourdomain.com"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingProject ? "Save Changes" : "Save & Generate API Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show-Once API Key Reveal Modal */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Your API Key — Copy It Now</h2>
                <p className="text-xs text-slate-400">
                  This is the only time <strong className="text-emerald-400">{revealedKey.projectName}</strong>&apos;s full key will be shown. It is not stored in plain text.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 mb-4">
              <code className="text-sm font-mono text-emerald-400 break-all select-all">
                {revealedKey.rawKey}
              </code>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(revealedKey.rawKey);
                  setRevealKeyCopied(true);
                  setTimeout(() => setRevealKeyCopied(false), 2000);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition"
              >
                {revealKeyCopied ? (
                  <><Check className="w-4 h-4" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy API Key</>  
                )}
              </button>
              <button
                onClick={() => { setRevealedKey(null); setRevealKeyCopied(false); }}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
              >
                I&apos;ve saved it
              </button>
            </div>

            <p className="text-[11px] text-amber-400/80 mt-4 text-center">
              ⚠ Close this only after saving the key to your .env file. It cannot be recovered.
            </p>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="max-w-6xl w-full mx-auto px-6 pb-8">
        <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-rose-300">Delete Account</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently delete your account and all data. A 30-day grace period applies before data is purged.
              </p>
            </div>
            <button
              onClick={() => { setShowDeleteModal(true); setDeletePassword(""); setDeleteError(""); }}
              className="shrink-0 px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/30 p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Delete your account</h2>
            <p className="text-xs text-slate-400 mb-4">
              This will immediately revoke all your API keys and projects. Your account data will be permanently purged after 30 days. This cannot be undone.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {deleteError}
              </div>
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
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
