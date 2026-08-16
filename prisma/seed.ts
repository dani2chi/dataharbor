import { PrismaClient } from "@prisma/client";
import { execFileSync } from "child_process";
import { resolve } from "path";

const db = new PrismaClient();

type ScraperOutput = {
  metrics: {
    pages_processed: number;
    failed_pages: number;
    records_extracted: number;
    valid_records: number;
    duplicates_removed: number;
    runtime_seconds: number;
  };
  logs: Array<{ level: string; message: string }>;
  records: Array<{
    business_name: string;
    category: string;
    website: string | null;
    email: string | null;
    phone: string | null;
    city: string;
    rating: number | null;
    review_count: number | null;
    description: string | null;
    source_url: string;
    validation_status: string;
    validation_issues: string[];
  }>;
  exports: Array<{
    name: string;
    format: string;
    size_bytes: number;
    path: string;
    record_count: number;
  }>;
};

let s = 7777;
const rand = () => {
  s = (s * 1103515245 + 12345) & 0x7fffffff;
  return s / 0x7fffffff;
};
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

async function runScraper(): Promise<ScraperOutput> {
  const root = resolve(__dirname, "..");
  const out = execFileSync("python3", [resolve(root, "scraper", "run_demo.py")], {
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(out);
}

async function main() {
  console.log("🌱 Seeding DataHarbor — running Python scraper to produce real data…");
  const result = await runScraper();
  console.log(
    `   Scraper produced ${result.metrics.records_extracted} records (${result.metrics.valid_records} valid, ${result.metrics.duplicates_removed} duplicates removed)`,
  );

  // Wipe.
  await db.scrapeLog.deleteMany();
  await db.exportFile.deleteMany();
  await db.extractedRecord.deleteMany();
  await db.scrapeJob.deleteMany();

  // Primary job — the most recent successful run, this is what the dashboard focuses on.
  const primary = await db.scrapeJob.create({
    data: {
      name: "London Hotel Directory Extraction",
      sourceType: "DEMO_DIRECTORY",
      startUrl: "https://demolocal.directory/london/hotels",
      category: "Hotels",
      location: "London",
      maxPages: 5,
      outputFormats: "CSV,JSON",
      deduplicate: true,
      validateUrls: true,
      status: result.metrics.failed_pages > 0 ? "COMPLETED_WITH_WARNINGS" : "COMPLETED",
      totalPages: result.metrics.pages_processed + result.metrics.failed_pages,
      pagesProcessed: result.metrics.pages_processed,
      recordsExtracted: result.metrics.records_extracted,
      validRecords: result.metrics.valid_records,
      duplicatesRemoved: result.metrics.duplicates_removed,
      failedPages: result.metrics.failed_pages,
      runtimeSeconds: result.metrics.runtime_seconds,
      startedAt: daysAgo(0),
      completedAt: daysAgo(0),
      createdAt: daysAgo(0),
    },
  });

  // Records
  for (const r of result.records) {
    await db.extractedRecord.create({
      data: {
        scrapeJobId: primary.id,
        businessName: r.business_name,
        category: r.category,
        website: r.website,
        email: r.email,
        phone: r.phone,
        city: r.city,
        country: "United Kingdom",
        rating: r.rating,
        reviewCount: r.review_count,
        description: r.description,
        sourceUrl: r.source_url,
        validationStatus: r.validation_status,
        validationIssues: r.validation_issues.length > 0 ? JSON.stringify(r.validation_issues) : null,
      },
    });
  }

  // Logs
  for (let i = 0; i < result.logs.length; i++) {
    const l = result.logs[i];
    await db.scrapeLog.create({
      data: {
        scrapeJobId: primary.id,
        level: l.level,
        message: l.message,
        createdAt: new Date(daysAgo(0).getTime() + i * 200),
      },
    });
  }

  // Exports
  for (const e of result.exports) {
    await db.exportFile.create({
      data: {
        scrapeJobId: primary.id,
        fileName: e.name,
        format: e.format,
        recordCount: e.record_count,
        filePath: e.path,
        sizeBytes: e.size_bytes,
      },
    });
  }

  // Add historical jobs for dashboard volume.
  const histJobNames = [
    { name: "Manchester Restaurants Pull", category: "Restaurants", location: "Manchester" },
    { name: "UK Coworking Spaces Sweep", category: "Coworking", location: "United Kingdom" },
    { name: "Edinburgh Boutique Hotels", category: "Hotels", location: "Edinburgh" },
    { name: "London Yoga Studios", category: "Wellness", location: "London" },
    { name: "Bristol Independent Cafés", category: "Cafés", location: "Bristol" },
    { name: "Cardiff Trade Services", category: "Services", location: "Cardiff" },
    { name: "Brighton Music Venues", category: "Venues", location: "Brighton" },
    { name: "Leeds B2B Software", category: "Technology", location: "Leeds" },
    { name: "Liverpool Wedding Venues", category: "Venues", location: "Liverpool" },
    { name: "Newcastle Pub Directory", category: "Hospitality", location: "Newcastle" },
    { name: "London Hotel Directory Extraction", category: "Hotels", location: "London" },
    { name: "London Hotel Directory Extraction", category: "Hotels", location: "London" },
    { name: "London Hotel Directory Extraction", category: "Hotels", location: "London" },
  ];

  for (let i = 0; i < histJobNames.length; i++) {
    const cfg = histJobNames[i];
    const failed = i === 4 ? 1 : i === 8 ? 2 : 0;
    const total = 4 + Math.floor(rand() * 8);
    const processed = total - failed;
    const records = processed * (10 + Math.floor(rand() * 12));
    const dupes = Math.floor(records * (0.06 + rand() * 0.1));
    const valid = records - dupes - Math.floor(records * 0.18);
    await db.scrapeJob.create({
      data: {
        name: cfg.name,
        sourceType: pick(["DEMO_DIRECTORY", "SEARCH_RESULTS", "REVIEW_PAGES"]),
        startUrl: `https://demolocal.directory/${cfg.location.toLowerCase().replace(/\s/g, "-")}/${cfg.category.toLowerCase()}`,
        category: cfg.category,
        location: cfg.location,
        maxPages: total,
        outputFormats: "CSV,JSON",
        deduplicate: true,
        validateUrls: true,
        status:
          i === 11
            ? "RUNNING"
            : failed > 0
              ? "COMPLETED_WITH_WARNINGS"
              : "COMPLETED",
        totalPages: total,
        pagesProcessed: i === 11 ? Math.floor(processed * 0.6) : processed,
        recordsExtracted: i === 11 ? Math.floor(records * 0.55) : records,
        validRecords: i === 11 ? Math.floor(valid * 0.5) : valid,
        duplicatesRemoved: i === 11 ? Math.floor(dupes * 0.5) : dupes,
        failedPages: failed,
        runtimeSeconds: 30 + rand() * 220,
        createdAt: daysAgo(2 + i * 3 + Math.floor(rand() * 2)),
        startedAt: daysAgo(2 + i * 3),
        completedAt: i === 11 ? null : daysAgo(2 + i * 3),
      },
    });
  }

  console.log(`✅ Seed complete: ${result.records.length} records on primary job + ${histJobNames.length} historical jobs.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
