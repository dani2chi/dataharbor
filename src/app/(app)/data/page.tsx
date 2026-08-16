import Link from "next/link";
import { Search, Download, Star } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TBody, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DataPage() {
  const records = await db.extractedRecord.findMany({
    take: 80,
    orderBy: [{ rating: "desc" }, { businessName: "asc" }],
    include: { scrapeJob: true },
  });
  const stats = {
    total: records.length,
    valid: records.filter((r) => r.validationStatus === "VALID").length,
    missingEmail: records.filter((r) => r.validationStatus === "MISSING_EMAIL").length,
    avgRating: records.length
      ? (records.reduce((s, r) => s + (r.rating ?? 0), 0) / records.length).toFixed(2)
      : "—",
  };

  return (
    <>
      <PageHeader
        title="Extracted data"
        description="Cleaned, deduplicated records produced by the pipeline"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" /> Export selected
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Pill label="Records shown" value={String(stats.total)} />
          <Pill label="Valid" value={String(stats.valid)} dot="#10b981" />
          <Pill label="Missing email" value={String(stats.missingEmail)} dot="#f59e0b" />
          <Pill label="Avg rating" value={String(stats.avgRating)} dot="#7c3aed" />
        </div>

        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search by name, city, website…"
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
              />
            </div>
            <Chip label="Job: All" />
            <Chip label="City: Any" />
            <Chip label="Validation: All" />
            <Chip label="Sort: Rating" />
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Business</TH>
                <TH>City</TH>
                <TH>Website</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH className="text-right">Rating</TH>
                <TH className="text-right">Reviews</TH>
                <TH>Validation</TH>
              </TR>
            </THead>
            <TBody>
              {records.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/data/${r.id}`} className="font-medium text-slate-900 hover:text-slate-700">
                      {r.businessName}
                    </Link>
                    <p className="text-xs text-slate-500">{r.category}</p>
                  </TD>
                  <TD className="text-sm text-slate-700">{r.city}</TD>
                  <TD className="max-w-[220px]">
                    <span className="truncate font-mono text-xs text-slate-700">{r.website ?? "—"}</span>
                  </TD>
                  <TD className="max-w-[220px]">
                    <span className="truncate font-mono text-xs text-slate-700">{r.email ?? <span className="italic text-slate-400">—</span>}</span>
                  </TD>
                  <TD className="font-mono text-xs text-slate-700">{r.phone}</TD>
                  <TD className="text-right">
                    {r.rating !== null && (
                      <span className="inline-flex items-center gap-1 tabular-nums text-slate-700">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {r.rating.toFixed(1)}
                      </span>
                    )}
                  </TD>
                  <TD className="text-right tabular-nums text-slate-500">{r.reviewCount}</TD>
                  <TD>
                    <Badge tone={r.validationStatus === "VALID" ? "success" : "warning"}>
                      {r.validationStatus.replace("_", " ").toLowerCase()}
                    </Badge>
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
