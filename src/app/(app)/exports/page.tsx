import { Download, FileSpreadsheet, FileJson, Search } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TBody, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function ExportsPage() {
  const exports = await db.exportFile.findMany({
    include: { scrapeJob: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSize = exports.reduce((s, e) => s + e.sizeBytes, 0);
  const totalRecords = exports.reduce((s, e) => s + e.recordCount, 0);

  return (
    <>
      <PageHeader
        title="Export center"
        description="Cleaned datasets ready for download in CSV, JSON, or Excel"
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" /> Download all
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Pill label="Files" value={String(exports.length)} />
          <Pill label="Total records" value={String(totalRecords)} dot="#0891b2" />
          <Pill label="Total size" value={`${(totalSize / 1024).toFixed(1)} KB`} dot="#7c3aed" />
          <Pill label="CSVs" value={String(exports.filter((e) => e.format === "CSV").length)} dot="#10b981" />
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search by filename…"
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
              />
            </div>
            <Chip label="Format: All" />
            <Chip label="Job: Any" />
            <Chip label="Sort: Recent" />
          </div>
          <Table>
            <THead>
              <TR>
                <TH>File</TH>
                <TH>From job</TH>
                <TH>Format</TH>
                <TH className="text-right">Records</TH>
                <TH className="text-right">Size</TH>
                <TH>Created</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {exports.map((e) => (
                <TR key={e.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                        {e.format === "JSON" ? <FileJson className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{e.fileName}</p>
                        <p className="font-mono text-xs text-slate-500">{e.filePath.replace(/^.*\/exports\//, "data/exports/")}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="text-sm text-slate-700">{e.scrapeJob.name}</TD>
                  <TD>
                    <Badge tone={e.format === "JSON" ? "purple" : e.format === "CSV" ? "success" : "info"}>{e.format}</Badge>
                  </TD>
                  <TD className="text-right tabular-nums">{e.recordCount}</TD>
                  <TD className="text-right tabular-nums text-slate-500">{(e.sizeBytes / 1024).toFixed(1)} KB</TD>
                  <TD className="text-xs text-slate-500">{formatDate(e.createdAt)}</TD>
                  <TD className="text-right">
                    <Button variant="outline" size="sm">
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </>
  );
}

function Pill({ label, value, dot = "#94a3b8" }: { label: string; value: string; dot?: string }) {
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
