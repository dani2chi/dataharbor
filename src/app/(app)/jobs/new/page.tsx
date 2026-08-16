import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Anchor, FileSpreadsheet, FileJson, Activity, ShieldCheck } from "lucide-react";

export default function NewJobPage() {
  return (
    <>
      <PageHeader
        title="New scrape job"
        description="Configure a fresh extraction run. Pre-filled with the demo source for screenshots."
      />
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Job configuration" />
          <CardBody className="space-y-5">
            <Field label="Job name">
              <Input defaultValue="London Hotel Directory Extraction" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Source type">
                <Select>
                  <option>Demo source — fictional London hotels</option>
                  <option>Directory pages</option>
                  <option>Search result pages</option>
                  <option>Hotel listings</option>
                  <option>Review pages</option>
                  <option>Custom HTML</option>
                </Select>
              </Field>
              <Field label="Start URL">
                <Input defaultValue="https://demolocal.directory/london/hotels" />
              </Field>
              <Field label="Category">
                <Input defaultValue="Hotels" />
              </Field>
              <Field label="Location">
                <Input defaultValue="London" />
              </Field>
              <Field label="Max pages">
                <Input type="number" defaultValue={5} />
              </Field>
              <Field label="Concurrency">
                <Select>
                  <option>2 (gentle)</option>
                  <option>4</option>
                  <option>8</option>
                </Select>
              </Field>
            </div>

            <Field label="Output formats">
              <div className="grid grid-cols-3 gap-3">
                <FormatToggle label="CSV" detail="One row per record" icon={<FileSpreadsheet className="h-4 w-4" />} on />
                <FormatToggle label="JSON" detail="Nested + validation" icon={<FileJson className="h-4 w-4" />} on />
                <FormatToggle label="Excel (xlsx)" detail="Pandas writer" icon={<FileSpreadsheet className="h-4 w-4" />} />
              </div>
            </Field>

            <Field label="Pipeline options">
              <div className="space-y-2">
                <CheckRow label="Deduplicate records" detail="Match on website, email, phone, or business name + city" on />
                <CheckRow label="Validate URLs and emails" detail="Strict format check before write" on />
                <CheckRow label="Retry failed pages" detail="Up to 3 attempts with exponential backoff" on />
                <CheckRow label="Push results to dashboard" detail="Write to SQLite and emit a webhook" on />
                <CheckRow label="Auto-export at completion" detail="Drop file into the export center" on />
              </div>
            </Field>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">All fields validated client- and server-side before run.</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Save as preset</Button>
                <Button size="sm">
                  <Anchor className="h-3.5 w-3.5" /> Run job
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="What this job will do" />
            <CardBody>
              <ol className="space-y-3 text-sm">
                {[
                  "Load the start URL",
                  "Walk pagination up to max pages",
                  "Extract listing fields from each page",
                  "Clean & normalize whitespace, phones, URLs, emails",
                  "Validate required fields and formats",
                  "Deduplicate by website / email / phone / name+city",
                  "Write valid records to the database",
                  "Generate CSV + JSON exports",
                ].map((s, i) => (
                  <li key={s} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-700">
                      {i + 1}
                    </span>
                    <span className="text-slate-700">{s}</span>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Built-in safeguards" />
            <CardBody className="space-y-3 text-sm">
              <Row icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />} label="Polite by default" detail="Respects robots.txt and rate-limits" />
              <Row icon={<Activity className="h-4 w-4 text-sky-500" />} label="Resumable" detail="Tracks visited URLs, can pick up where it left off" />
              <Row icon={<FileJson className="h-4 w-4 text-violet-500" />} label="Schema-validated" detail="Output is a strict, predictable shape" />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
    />
  );
}
function Select({ children }: { children: React.ReactNode }) {
  return (
    <select className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-300 focus:outline-none">
      {children}
    </select>
  );
}
function FormatToggle({ label, detail, icon, on = false }: { label: string; detail: string; icon: React.ReactNode; on?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${on ? "border-cyan-300 bg-cyan-50/40" : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-center gap-2">
        <span className={on ? "text-cyan-700" : "text-slate-500"}>{icon}</span>
        <p className={`text-sm font-semibold ${on ? "text-cyan-900" : "text-slate-800"}`}>{label}</p>
      </div>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
function CheckRow({ label, detail, on = false }: { label: string; detail: string; on?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-cyan-500 bg-cyan-500 text-white" : "border-slate-300 bg-white"}`}
      >
        {on && <span className="text-[10px]">✓</span>}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
function Row({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <span>{icon}</span>
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
