import { Bell, Search, Activity } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/90 px-6 backdrop-blur">
      <div className="hidden flex-1 items-center md:flex">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search jobs, records, exports…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:flex">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-medium text-slate-700">Pipeline healthy</span>
        </div>
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-xs font-semibold text-white">DR</span>
          <span className="hidden text-sm font-medium text-slate-900 sm:block">Dana Reyes</span>
        </div>
      </div>
    </header>
  );
}
