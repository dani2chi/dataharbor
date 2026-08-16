import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TBody, TD } from "@/components/ui/table";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatRelativeDate } from "@/lib/utils";

export default async function JobsPage() {
  const jobs = await db.scrapeJob.findMany({ orderBy: { createdAt: "desc" } });

  const stats = {
    completed: jobs.filter((j) => j.status === "COMPLETED").length,
    warnings: jobs.filter((j) => j.status === "COMPLETED_WITH_WARNINGS").length,
    running: jobs.filter((j) => j.status === "RUNNING").length,
    failed: jobs.filter((j) => j.status === "FAILED").length,
  };

  return (
    <>
      <PageHeader
        title="Scrape jobs"
        description="Every extraction run, queued, in progress, or complete"
        actions={
          <Link href="/jobs/new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> New scrape job
            </Button>
          </Link>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Pill label="Completed" value={stats.completed} dot="#10b981" />
          <Pill label="With warnings" value={stats.warnings} dot="#f59e0b" />
          <Pill label="Running" value={stats.running} dot="#0ea5e9" />
          <Pill label="Failed" value={stats.failed} dot="#ef4444" />
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search jobs by name or category…"
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
              />
            </div>
            <Chip label="Status: All" />
            <Chip label="Source: Any" />
            <Chip label="Sort: Recent" />
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Job</TH>
                <TH>Category</TH>
                <TH>Location</TH>
                <TH>Status</TH>
                <TH>Pages</TH>
                <TH className="text-right">Records</TH>
                <TH className="text-right">Valid</TH>
                <TH className="text-right">Dupes</TH>
                <TH className="text-right">Runtime</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {jobs.map((j) => {
                const pct = j.totalPages ? Math.round((j.pagesProcessed / j.totalPages) * 100) : 0;
                return (
                  <TR key={j.id}>
                    <TD>
                      <Link href={`/jobs/${j.id}`} className="font-medium text-slate-900 hover:text-slate-700">
                        {j.name}
                      </Link>
                      <p className="text-xs text-slate-500">{j.sourceType.replace(/_/g, " ").toLowerCase()}</p>
                    </TD>
                    <TD className="text-sm text-slate-700">{j.category}</TD>
                    <TD className="text-sm text-slate-700">{j.location}</TD>
                    <TD>
                      <Badge tone={statusTone(j.status)}>{j.status.replace(/_/g, " ").toLowerCase()}</Badge>
                    </TD>
                    <TD className="w-[160px]">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={pct}
                          tone={j.status === "FAILED" ? "danger" : pct >= 80 ? "success" : "default"}
                        />
                        <span className="text-xs tabular-nums text-slate-600">{j.pagesProcessed}/{j.totalPages}</span>
                      </div>
                    </TD>
                    <TD className="text-right tabular-nums">{j.recordsExtracted}</TD>
                    <TD className="text-right tabular-nums text-emerald-700">{j.validRecords}</TD>
                    <TD className="text-right tabular-nums text-slate-500">{j.duplicatesRemoved}</TD>
                    <TD className="text-right text-xs tabular-nums text-slate-500">{j.runtimeSeconds.toFixed(1)}s</TD>
                    <TD className="text-xs text-slate-500">{formatRelativeDate(j.createdAt)}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  );
}

function Pill({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      </div>
    </div>
  );
}
function Chip({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-300">
      {label}
    </button>
  );
}
