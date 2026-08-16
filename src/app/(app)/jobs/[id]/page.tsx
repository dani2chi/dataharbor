import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Database,
  Copy,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  FileJson,
  Anchor,
  Download,
} from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const STAGE_DEFS = [
  { key: "Source discovery", description: "Resolve start URL, configure pagination" },
  { key: "Page loading", description: "Fetch each page with retry + backoff" },
  { key: "Data extraction", description: "Parse listing cards into raw records" },
  { key: "Cleaning", description: "Normalize whitespace, phones, URLs, emails" },
  { key: "Deduplication", description: "Collapse matches across website / email / phone / name+city" },
  { key: "Validation", description: "Enforce field rules and formats" },
  { key: "Export", description: "Write CSV + JSON files into the export center" },
];

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await db.scrapeJob.findUnique({
    where: { id },
    include: {
      logs: { orderBy: { createdAt: "asc" } },
      records: { take: 8 },
      exports: true,
    },
  });
  if (!job) notFound();

  const pagesPct = job.totalPages ? Math.round((job.pagesProcessed / job.totalPages) * 100) : 0;
  const validationPct = job.recordsExtracted
    ? Math.round((job.validRecords / job.recordsExtracted) * 100)
    : 0;
  const isRunning = job.status === "RUNNING";

  // Stage progress: pretend all stages done if completed, half done if running.
  const stages = STAGE_DEFS.map((s, i) => {
    const idx = isRunning ? Math.floor(STAGE_DEFS.length * 0.55) : STAGE_DEFS.length;
    return {
      ...s,
      status: i < idx ? "DONE" : i === idx ? "RUNNING" : "PENDING",
    };
  });

  return (
    <>
      <PageHeader
        title={job.name}
        description={`${job.category} · ${job.location} · started ${job.startedAt?.toLocaleString() ?? "—"}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(job.status)}>{job.status.replace(/_/g, " ").toLowerCase()}</Badge>
            <Link href={`/data?job=${job.id}`}>
              <Button variant="outline" size="sm">
                <Database className="h-3.5 w-3.5" /> View records
              </Button>
            </Link>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Pipeline progress" description={`Stage ${stages.findIndex((s) => s.status === "RUNNING") + 1 || stages.length} of ${stages.length}`} />
            <CardBody>
              <ol className="space-y-3">
                {stages.map((s, i) => (
                  <li key={s.key} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        s.status === "DONE"
                          ? "bg-emerald-100 text-emerald-700"
                          : s.status === "RUNNING"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {s.status === "DONE" ? "✓" : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{s.key}</p>
                        <Badge
                          tone={
                            s.status === "DONE"
                              ? "success"
                              : s.status === "RUNNING"
                                ? "info"
                                : "neutral"
                          }
                        >
                          {s.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{s.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Run log" description={`${job.logs.length} entries`} />
            <CardBody className="p-0">
              <ol className="divide-y divide-slate-100">
                {job.logs.map((l) => (
                  <li key={l.id} className="flex items-start gap-3 px-5 py-2.5">
                    <span className="w-16 shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
                      {new Date(l.createdAt).toLocaleTimeString("en-US", { hour12: false })}
                    </span>
                    <Badge
                      tone={
                        l.level === "ERROR"
                          ? "danger"
                          : l.level === "WARN"
                            ? "warning"
                            : l.level === "SUCCESS"
                              ? "success"
                              : "info"
                      }
                    >
                      {l.level.toLowerCase()}
                    </Badge>
                    <p className="flex-1 text-sm text-slate-700">{l.message}</p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Sample of extracted records" description={`First 8 of ${job.recordsExtracted}`} />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {job.records.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 px-5 py-3">
                    <Anchor className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{r.businessName}</p>
                      <p className="truncate text-xs text-slate-500">
                        {r.city} · {r.email ?? "no email"} · {r.website ?? "no site"}
                      </p>
                    </div>
                    <Badge tone={r.validationStatus === "VALID" ? "success" : "warning"}>
                      {r.validationStatus.replace("_", " ").toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Summary" />
            <CardBody className="space-y-4">
              <Metric label="Pages processed" value={`${job.pagesProcessed} / ${job.totalPages}`} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                <Progress value={pagesPct} />
              </Metric>
              <Metric label="Records extracted" value={String(job.recordsExtracted)} icon={<Database className="h-3.5 w-3.5" />} />
              <Metric label="Valid records" value={`${job.validRecords} (${validationPct}%)`} icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}>
                <Progress value={validationPct} tone="success" />
              </Metric>
              <Metric label="Duplicates removed" value={String(job.duplicatesRemoved)} icon={<Copy className="h-3.5 w-3.5 text-amber-500" />} />
              <Metric label="Failed pages" value={String(job.failedPages)} icon={<AlertTriangle className="h-3.5 w-3.5 text-rose-500" />} />
              <Metric label="Runtime" value={`${job.runtimeSeconds.toFixed(2)}s`} icon={<Clock className="h-3.5 w-3.5" />} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Configuration" />
            <CardBody className="space-y-2 text-sm">
              <KV label="Source type" value={job.sourceType.replace(/_/g, " ").toLowerCase()} />
              <KV label="Start URL" value={job.startUrl} mono />
              <KV label="Max pages" value={String(job.maxPages)} />
              <KV label="Output formats" value={job.outputFormats} />
              <KV label="Deduplicate" value={job.deduplicate ? "Yes" : "No"} />
              <KV label="Validate URLs" value={job.validateUrls ? "Yes" : "No"} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Exports" />
            <CardBody className="space-y-2">
              {job.exports.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                    {e.format === "JSON" ? <FileJson className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{e.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {e.recordCount} records · {(e.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {job.exports.length === 0 && (
                <p className="px-2 py-3 text-xs text-slate-500">Exports will appear here when the job completes.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  icon,
  children,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-slate-500">
          {icon}
          {label}
        </span>
        <span className="font-semibold tabular-nums text-slate-900">{value}</span>
      </div>
      {children && <div className="mt-1.5">{children}</div>}
    </div>
  );
}
function KV({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <span
        className={`max-w-[60%] text-right text-sm text-slate-800 ${mono ? "break-all font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
