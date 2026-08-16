"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListPlus,
  Database,
  ScrollText,
  FileDown,
  Settings,
  Anchor,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Scrape jobs", icon: ListPlus },
  { href: "/data", label: "Extracted data", icon: Database },
  { href: "/logs", label: "Run logs", icon: ScrollText },
  { href: "/exports", label: "Export center", icon: FileDown },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-slate-200 md:bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-600 to-teal-600 text-white">
          <Anchor className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">DataHarbor</p>
          <p className="text-[11px] text-slate-500">Extraction pipeline</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 px-3 py-3">
        <div className="rounded-lg bg-cyan-50 p-3">
          <p className="text-xs font-medium text-cyan-900">Demo mode</p>
          <p className="mt-1 text-[11px] text-cyan-700">
            Pipeline runs against generated fake business listings — no live scraping.
          </p>
        </div>
      </div>
    </aside>
  );
}
