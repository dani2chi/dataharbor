import { Search, Download } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

const LEVEL_TONE: Record<string, "info" | "warning" | "danger" | "success" | "neutral"> = {
  INFO: "info",
  WARN: "warning",
  ERROR: "danger",
  SUCCESS: "success",
};

export default async function LogsPage() {
  const jobs = await db.scrapeJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      logs: { orderBy: { createdAt: "asc" } },
    },
  });
  // Focal: prefer the job with the most logs (the seeded primary job).
  const focal =
    jobs.find((j) => j.logs.length > 5) ??
    jobs[0];

  return (
    <>
      <PageHeader
        title="Run logs"
        description="Step-by-step trace of every scrape job, ready for audit and debugging"
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <Card>
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                placeholder="Filter jobs…"
                className="w-full bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <ul className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <li
                  key={j.id}
                  className={`flex items-start gap-3 px-4 py-3 ${j.id === focal?.id ? "bg-cyan-50/40" : "hover:bg-slate-50"}`}
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      j.status === "COMPLETED"
                        ? "bg-emerald-500"
                        : j.status === "RUNNING"
                          ? "bg-sky-500"
                          : j.status === "FAILED"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <Link href={`/jobs/${j.id}`} className="block truncate text-sm font-medium text-slate-800 hover:text-slate-900">
                      {j.name}
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      {j.recordsExtracted} records · {j.logs.length} logs · {formatRelativeDate(j.createdAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone(j.status)}>{j.status.replace(/_/g, " ").toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        {focal && (
          <section className="space-y-6 lg:col-span-8">
            <Card>
              <CardHeader
                title={`Run trace · ${focal.name}`}
                description={`${focal.logs.length} entries · ${focal.runtimeSeconds.toFixed(2)}s · ${focal.recordsExtracted} records`}
                action={<Badge tone={statusTone(focal.status)}>{focal.status.replace(/_/g, " ").toLowerCase()}</Badge>}
              />
              <CardBody className="p-0">
                <ol className="divide-y divide-slate-100">
                  {focal.logs.map((l, i) => (
                    <li key={l.id} className="flex items-start gap-3 px-5 py-2.5">
                      <span className="w-12 shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="w-16 shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
                        {new Date(l.createdAt).toLocaleTimeString("en-US", { hour12: false })}
                      </span>
                      <Badge tone={LEVEL_TONE[l.level] ?? "neutral"}>{l.level.toLowerCase()}</Badge>
                      <p className="flex-1 text-sm text-slate-700">{l.message}</p>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
