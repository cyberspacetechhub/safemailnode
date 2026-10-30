"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "danger" | "pink" | "amber";
  external?: boolean;
  divider?: boolean;
}

interface MobileNavProps {
  items: NavItem[];
}

const variantClass: Record<string, string> = {
  default: "text-slate-200 hover:text-white",
  danger: "text-rose-300 hover:text-rose-200",
  pink: "text-pink-300 hover:text-pink-200",
  amber: "text-amber-300 hover:text-amber-200",
};

export default function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative sm:hidden" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
        aria-label="Open menu"
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 py-1 overflow-hidden">
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-t border-slate-800 mt-1">
                {item.label}
              </div>
            ) : item.href ? (
              <Link
                key={i}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-slate-800 ${variantClass[item.variant ?? "default"]}`}
              >
                {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                {item.label}
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-slate-800 ${variantClass[item.variant ?? "default"]}`}
              >
                {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
