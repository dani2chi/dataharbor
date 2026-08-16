"""End-to-end runner.

Reads pages → parses → cleans → validates → deduplicates → exports.

Produces a JobResult containing the metrics the dashboard displays. The
companion script `scripts/seed.py` calls into this and writes results into the
DataHarbor SQLite DB via Prisma's generated schema (we use plain SQLite here
to avoid pulling in an ORM client just for the seeder).
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, List, Optional, Tuple

from . import cleaner, deduplicator, exporter, fetcher, parser, validator
from .cleaner import CleanRecord
from .fixtures import list_pages
from .validator import ValidationResult


@dataclass
class JobResult:
    pages_processed: int = 0
    failed_pages: int = 0
    records_extracted: int = 0
    valid_records: int = 0
    duplicates_removed: int = 0
    runtime_seconds: float = 0.0
    records: List[Tuple[CleanRecord, ValidationResult]] = field(default_factory=list)
    discarded: List[Tuple[CleanRecord, str]] = field(default_factory=list)
    log_lines: List[Tuple[str, str]] = field(default_factory=list)  # (level, message)
    export_paths: List[Path] = field(default_factory=list)


def run(
    max_pages: Optional[int] = None,
    deduplicate: bool = True,
    validate_records: bool = True,
    export_basename: str = "london_hotels_clean",
    progress: Optional[Callable[[str, str], None]] = None,
) -> JobResult:
    start = time.perf_counter()
    pages = list_pages()
    if max_pages is not None:
        pages = pages[:max_pages]

    result = JobResult()

    def log(level: str, message: str) -> None:
        result.log_lines.append((level, message))
        if progress:
            progress(level, message)

    log("INFO", f"Job started · {len(pages)} pages queued")

    raw: List[parser.RawRecord] = []
    for page in pages:
        try:
            html = fetcher.fetch(str(page))
            page_records = parser.parse(html)
            raw.extend(page_records)
            result.pages_processed += 1
            log("INFO", f"{page.name} loaded — {len(page_records)} listings extracted")
        except Exception as exc:  # pragma: no cover
            result.failed_pages += 1
            log("ERROR", f"{page.name} failed: {exc}")

    log("INFO", f"Cleaning {len(raw)} raw records")
    cleaned: List[CleanRecord] = []
    for r in raw:
        c = cleaner.clean(r)
        if c is not None:
            cleaned.append(c)
    result.records_extracted = len(cleaned)
    log("SUCCESS", f"{len(cleaned)} records cleaned and normalized")

    if deduplicate:
        dedupe_result = deduplicator.dedupe(cleaned)
        result.duplicates_removed = len(dedupe_result.discarded)
        log(
            "INFO",
            f"Removed {result.duplicates_removed} duplicate records (kept {len(dedupe_result.kept)})",
        )
        cleaned = dedupe_result.kept
        result.discarded = dedupe_result.discarded

    valids: List[Tuple[CleanRecord, ValidationResult]] = []
    if validate_records:
        for rec in cleaned:
            res = validator.validate(rec)
            valids.append((rec, res))
            if res.status != "VALID":
                log("WARN", f"{rec.business_name}: {', '.join(res.issues)}")
        result.valid_records = sum(1 for _, r in valids if r.status == "VALID")
    else:
        valids = [(rec, ValidationResult(status="VALID")) for rec in cleaned]
        result.valid_records = len(cleaned)

    result.records = valids

    # Export
    valid_only = [r for r, v in valids if v.status == "VALID"]
    statuses = [v.status for _, v in valids]
    csv_path = exporter.export_csv(
        [r for r, _ in valids], f"{export_basename}.csv", statuses
    )
    json_path = exporter.export_json(
        [r for r, _ in valids], f"{export_basename}.json", statuses
    )
    valid_csv = exporter.export_csv(valid_only, f"{export_basename}_valid_only.csv")
    result.export_paths = [csv_path, json_path, valid_csv]
    log("SUCCESS", f"Exported {csv_path.name}, {json_path.name}, {valid_csv.name}")

    result.runtime_seconds = round(time.perf_counter() - start, 2)
    log(
        "SUCCESS",
        f"Job completed in {result.runtime_seconds}s · {result.valid_records} valid · {result.duplicates_removed} duplicates removed",
    )
    return result
