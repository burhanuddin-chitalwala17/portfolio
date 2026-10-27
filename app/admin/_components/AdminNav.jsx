"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Documents" },
  { href: "/admin/inbox", label: "Inbox" },
];

export default function AdminNav({ openQueries = 0 }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex gap-2 border-b border-slate-200">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
            {tab.href === "/admin/inbox" && openQueries > 0 && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{openQueries}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
