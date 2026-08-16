import { notFound } from "next/navigation";
import { Star, Globe, Mail, Phone, MapPin, Tag, ShieldCheck, Database, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rec = await db.extractedRecord.findUnique({
    where: { id },
    include: { scrapeJob: true },
  });
  if (!rec) notFound();

  const issues: string[] = rec.validationIssues ? JSON.parse(rec.validationIssues) : [];

  return (
    <>
      <PageHeader
        title={rec.businessName}
        description={`Extracted by job "${rec.scrapeJob.name}" · ${formatDate(rec.createdAt)}`}
        actions={
          <Badge tone={rec.validationStatus === "VALID" ? "success" : "warning"}>
            {rec.validationStatus.replace("_", " ").toLowerCase()}
          </Badge>
        }
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Contact details" />
            <CardBody className="space-y-4">
              <Row icon={<Tag className="h-4 w-4" />} label="Category" value={rec.category} />
              <Row icon={<MapPin className="h-4 w-4" />} label="City" value={`${rec.city}, ${rec.country}`} />
              <Row icon={<Globe className="h-4 w-4" />} label="Website" value={rec.website ?? <Missing />} mono />
              <Row icon={<Mail className="h-4 w-4" />} label="Email" value={rec.email ?? <Missing />} mono />
              <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={rec.phone ?? <Missing />} mono />
              <Row icon={<ExternalLink className="h-4 w-4" />} label="Source URL" value={rec.sourceUrl} mono />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Description" />
            <CardBody>
              <p className="text-sm leading-relaxed text-slate-700">{rec.description ?? "No description extracted."}</p>
            </CardBody>
          </Card>

          {issues.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader title="Validation issues" description="Things that need a closer look before this record is exported" />
              <CardBody>
                <ul className="space-y-2 text-sm">
                  {issues.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-800">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {i}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Ratings" />
            <CardBody>
              {rec.rating !== null ? (
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">{rec.rating.toFixed(1)}</p>
                  <p className="text-sm text-slate-500">{rec.reviewCount} reviews</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No rating extracted.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Lineage" />
            <CardBody className="space-y-2 text-sm">
              <KV label="Job" value={rec.scrapeJob.name} icon={<Database className="h-3.5 w-3.5" />} />
              <KV label="Source type" value={rec.scrapeJob.sourceType.replace(/_/g, " ").toLowerCase()} />
              <KV label="Extracted" value={formatDate(rec.createdAt)} />
              <KV label="Validation" value={rec.validationStatus.replace("_", " ").toLowerCase()} icon={<ShieldCheck className="h-3.5 w-3.5" />} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`max-w-[60%] text-right text-sm text-slate-900 ${mono ? "break-all font-mono text-xs" : ""}`}>
        {value}
      </div>
    </div>
  );
}
function KV({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        {icon} {label}
      </span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}
function Missing() {
  return <span className="italic text-slate-400">missing</span>;
}
