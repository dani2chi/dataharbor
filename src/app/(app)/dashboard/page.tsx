import {
  ListPlus,
  Database,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Clock,
  Anchor,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { formatNumber, formatRelativeDate } from "@/lib/utils";

export default async function DashboardPage() {
  const [jobs, allRecords, exports] = await Promise.all([
    db.scrapeJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.extractedRecord.findMany({ select: { validationStatus: true, category: true } }),
    db.exportFile.count(),
  ]);

  const totalJobs = jobs.length;
  const totalExtracted = jobs.reduce((s, j) => s + j.recordsExtracted, 0);
  const totalValid = jobs.reduce((s, j) => s + j.validRecords, 0);
  const totalDupes = jobs.reduce((s, j) => s + j.duplicatesRemoved, 0);
  const totalFailedPages = jobs.reduce((s, j) => s + j.failedPages, 0);
  const successRate = totalExtracted ? Math.round((totalValid / totalExtracted) * 100) : 0;
  const lastJob = jobs[0];

  // 14-day records-extracted trend (synthesized from job creation dates).
  const trend: Array<{ label: string; records: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const dayRecords = jobs
      .filter((j) => j.createdAt >= start && j.createdAt < end)
      .reduce((s, j) => s + j.recordsExtracted, 0);
    trend.push({
      label: start.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      records: dayRecords,
    });
  }

  // Validation status breakdown of all records currently in DB.
  const validationCounts = ["VALID", "MISSING_EMAIL", "DUPLICATE", "INVALID_URL", "NEEDS_REVIEW"].map((s) => ({
    label: s.replace("_", " ").toLowerCase(),
    count: allRecords.filter((r) => r.validationStatus === s).length,
  }));

  return (
    <>
      <PageHeader
        title="Extraction overview"
        description="Pipeline activity, data quality, and exports across every scrape job"
        actions={
          <Link href="/jobs/new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> New scrape job
            </Button>
          </Link>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Scrape jobs"
            value={formatNumber(totalJobs)}
            delta={{ value: "+3 this week", positive: true }}
            icon={<ListPlus className="h-4 w-4" />}
            tone="info"
          />
          <StatCard
            label="Records extracted"
            value={formatNumber(totalExtracted)}
            delta={{ value: `+${jobs.slice(0, 3).reduce((s, j) => s + j.recordsExtracted, 0)} recent`, positive: true }}
            icon={<Database className="h-4 w-4" />}
            tone="info"
          />
          <StatCard
            label="Valid records"
            value={formatNumber(totalValid)}
            hint={`${successRate}% pass validation`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="success"
          />
          <StatCard
            label="Duplicates removed"
            value={formatNumber(totalDupes)}
            hint={`${totalFailedPages} failed pages all-time`}
            icon={<Copy className="h-4 w-4" />}
            tone="warning"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Records extracted (14d)"
              description={`${exports} export files generated · last run ${lastJob ? formatRelativeDate(lastJob.createdAt) : "—"}`}
            />
            <CardBody>
              <AreaChart data={trend} dataKey="records" color="#0891b2" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Data quality" description="All records currently in store" />
            <CardBody>
              <BarChart
                data={validationCounts}
                dataKey="count"
                colors={["#10b981", "#f59e0b", "#94a3b8", "#ef4444", "#a855f7"]}
                height={200}
              />
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Recent jobs"
              description="Last 8 scrape runs"
              action={
                <Link href="/jobs" className="text-xs font-medium text-slate-700 hover:text-slate-900">
                  View all →
                </Link>
              }
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {jobs.slice(0, 8).map((j) => (
                  <li key={j.id} className="px-5 py-3.5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                        <Anchor className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link href={`/jobs/${j.id}`} className="truncate text-sm font-medium text-slate-900 hover:text-slate-700">
                            {j.name}
                          </Link>
                          <Badge tone={statusTone(j.status)}>{j.status.replace(/_/g, " ").toLowerCase()}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {j.category} · {j.location} · {j.pagesProcessed}/{j.totalPages} pages
                        </p>
                      </div>
                      <div className="hidden gap-6 text-right text-xs text-slate-600 sm:flex">
                        <Stat label="Records" value={String(j.recordsExtracted)} />
                        <Stat label="Valid" value={String(j.validRecords)} />
                        <Stat label="Dupes" value={String(j.duplicatesRemoved)} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Heads-up"
              description="Items worth a quick look"
              action={<AlertTriangle className="h-4 w-4 text-amber-500" />}
            />
            <CardBody>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span className="text-slate-700">
                    <strong className="text-slate-900">{validationCounts[1].count}</strong> records missing email — eligible for an enrichment pass
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span className="text-slate-700">
                    <strong className="text-slate-900">{totalFailedPages}</strong> total page failures across all jobs
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <span className="text-slate-700">1 job currently <strong>Running</strong> — check the queue</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="text-slate-700">Avg job runtime: <strong>{(jobs.reduce((s, j) => s + j.runtimeSeconds, 0) / Math.max(jobs.length, 1)).toFixed(1)}s</strong></span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
