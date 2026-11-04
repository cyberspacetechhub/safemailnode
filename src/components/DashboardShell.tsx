"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Code2, Activity, User, LogOut, BookOpen, Heart, Snowflake } from "lucide-react";
import BrandLogo from "./BrandLogo";
import MobileNav from "./MobileNav";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    plan: string;
    isFrozen: boolean;
  };
  onLogout: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Integrate", href: "/dashboard?tab=integrate", icon: Code2 },
  { label: "Logs", href: "/dashboard?tab=logs", icon: Activity },
  { label: "Profile", href: "/dashboard/profile", icon: User },
];

const bottomItems = [
  { label: "Docs", href: "/docs", icon: BookOpen },
  { label: "Support", href: "/support", icon: Heart, pink: true },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0 select-none">
      {initials}
    </div>
  );
}

export default function DashboardShell({ children, user, onLogout }: DashboardShellProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href.startsWith("/dashboard?")) return false;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" badge={user.plan.toUpperCase()} />
          <div className="flex items-center gap-3">
            {/* Avatar → profile (desktop) */}
            <Link
              href="/dashboard/profile"
              className="hidden sm:flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/70 transition group"
              title="Go to Profile"
            >
              <Avatar name={user.name} />
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight group-hover:text-emerald-400 transition truncate max-w-[140px]">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{user.email}</p>
              </div>
            </Link>
            {/* Mobile nav */}
            <MobileNav items={[
              { label: "Menu", divider: true },
              { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4 text-emerald-400" /> },
              { label: "Integrate", href: "/dashboard?tab=integrate", icon: <Code2 className="w-4 h-4 text-emerald-400" /> },
              { label: "Logs", href: "/dashboard?tab=logs", icon: <Activity className="w-4 h-4 text-emerald-400" /> },
              { label: "Profile", href: "/dashboard/profile", icon: <User className="w-4 h-4 text-emerald-400" /> },
              { label: "Resources", divider: true },
              { label: "Docs", href: "/docs", icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
              { label: "Support", href: "/support", icon: <Heart className="w-4 h-4 text-pink-400" />, variant: "pink" as const },
              { label: user.name, divider: true, subtitle: user.email },
              { label: "Sign Out", onClick: onLogout, icon: <LogOut className="w-4 h-4" />, variant: "danger" as const },
            ]} />
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0">
          <div className="sticky top-24 flex flex-col h-[calc(100vh-7rem)]">
            {/* Main nav */}
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">Menu</p>
              {navItems.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-0.5 ${
                    isActive(href)
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}

              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">Resources</p>
                {bottomItems.map(({ label, href, icon: Icon, pink }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-0.5 ${
                      pink
                        ? "text-pink-400/80 hover:text-pink-300 hover:bg-pink-500/10"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom: avatar card + sign out */}
            <div className="pt-4 border-t border-slate-800">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-800/60 transition group mb-1"
              >
                <Avatar name={user.name} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-400 transition">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
              </Link>
              <span className="inline-block ml-3 mb-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
                {user.plan}
              </span>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-10">
          {user.isFrozen && (
            <div className="mb-6 p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-200 flex items-center gap-3 text-sm">
              <Snowflake className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <strong>Your account is currently frozen.</strong> Outgoing email delivery and new project creation are temporarily paused by an administrator.
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
