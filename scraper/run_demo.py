"""Generate the demo source HTML and run the scraping pipeline against it.

Output is JSON on stdout — the Node seeder consumes it and writes to SQLite.
"""

from __future__ import annotations

import json
import sys
from dataclasses import asdict
from pathlib import Path

# Ensure the package is importable when run directly.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dataharbor import fixtures, runner


def main() -> int:
    fixtures.write_demo_source(per_page=12, count=60)
    result = runner.run(max_pages=None, deduplicate=True, validate_records=True)

    payload = {
        "metrics": {
            "pages_processed": result.pages_processed,
            "failed_pages": result.failed_pages,
            "records_extracted": result.records_extracted,
            "valid_records": result.valid_records,
            "duplicates_removed": result.duplicates_removed,
            "runtime_seconds": result.runtime_seconds,
        },
        "logs": [{"level": l, "message": m} for l, m in result.log_lines],
        "records": [
            {
                **asdict(rec),
                "validation_status": v.status,
                "validation_issues": v.issues,
            }
            for rec, v in result.records
        ],
        "exports": [
            {
                "name": p.name,
                "format": p.suffix.lstrip(".").upper(),
                "size_bytes": p.stat().st_size,
                "path": str(p),
                "record_count": _count_lines(p) if p.suffix == ".csv" else len(result.records),
            }
            for p in result.export_paths
        ],
    }
    json.dump(payload, sys.stdout, ensure_ascii=False)
    return 0


def _count_lines(p: Path) -> int:
    with p.open("r", encoding="utf-8") as f:
        return sum(1 for _ in f) - 1  # minus header


if __name__ == "__main__":
    raise SystemExit(main())
