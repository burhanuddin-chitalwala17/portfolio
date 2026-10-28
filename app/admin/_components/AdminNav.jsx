"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Documents" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/chats", label: "Chats" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/ai", label: "AI" },
];

export default function AdminNav({ openQueries = 0 }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-fg/10">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active ? "border-fg text-fg" : "border-transparent text-fg/60 hover:text-fg/90"
            }`}
          >
            {tab.label}
            {tab.href === "/admin/inbox" && openQueries > 0 && (
              <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-surface">{openQueries}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
