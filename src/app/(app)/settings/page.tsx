import { Cog, Database, ShieldCheck, Webhook } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Pipeline defaults, validation rules, exports, and integrations" />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Pipeline defaults" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Default concurrency" value="2 requests per host" />
              <Field label="Retry policy" value="3 attempts · exponential backoff" />
              <Field label="User-Agent" value="DataHarborBot/1.0 (+contact@yourdomain)" />
              <Field label="Timeout" value="20 seconds per page" />
              <Field label="Robots.txt" value="Respected" />
              <Field label="Rate-limit safety net" value="0.6s between requests" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Cleaning rules" description="What every record passes through before validation" />
            <CardBody className="space-y-3">
              <Rule label="Trim and collapse whitespace" detail="One space between tokens" />
              <Rule label="Lowercase emails" detail="Case-insensitive deduplication" />
              <Rule label="Strip URL tracking parameters" detail="utm_*, gclid, fbclid removed" />
              <Rule label="Normalize phone digits" detail="Keep + and digits only, single spaces" />
              <Rule label="Coerce types" detail="Ratings → float, review counts → int" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Validation rules" description="Records that fail are flagged, not dropped" />
            <CardBody className="space-y-3">
              <Rule label="Email format" detail="RFC 5322-lite regex; missing flagged separately" />
              <Rule label="URL format" detail="https only by default" />
              <Rule label="Rating bounds" detail="0–5 inclusive" />
              <Rule label="Required fields" detail="business_name, source_url" />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Integrations" />
            <CardBody className="space-y-3">
              <Integration name="Postgres mirror" detail="Async replication for analytics" connected={false} />
              <Integration name="Webhook (POST)" detail="https://demolocal.directory/hook" connected />
              <Integration name="Slack #scrape-alerts" detail="Notify on FAILED jobs" connected />
              <Integration name="Google Sheets" detail="Append valid records to a sheet" connected={false} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Storage" />
            <CardBody className="space-y-3 text-sm">
              <KV icon={<Database className="h-3.5 w-3.5" />} label="Records DB" value="SQLite · file:./prisma/dev.db" />
              <KV icon={<Database className="h-3.5 w-3.5" />} label="Raw HTML cache" value="data/raw/" />
              <KV icon={<Database className="h-3.5 w-3.5" />} label="Exports" value="data/exports/" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Compliance" />
            <CardBody className="space-y-2 text-sm">
              <p className="text-slate-700">DataHarbor only operates against demo or authorised sources.</p>
              <ul className="space-y-1 text-xs text-slate-500">
                <li>· Robots.txt is honoured.</li>
                <li>· Rate limits are conservative by default.</li>
                <li>· No PII is collected from non-public records.</li>
              </ul>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                <ShieldCheck className="h-3.5 w-3.5" /> View policy
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">{value}</div>
    </div>
  );
}
function Rule({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <Cog className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
function Integration({ name, detail, connected }: { name: string; detail: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Webhook className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </div>
      <Badge tone={connected ? "success" : "neutral"}>{connected ? "connected" : "off"}</Badge>
    </div>
  );
}
function KV({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        {icon} {label}
      </span>
      <span className="font-mono text-xs text-slate-800">{value}</span>
    </div>
  );
}
