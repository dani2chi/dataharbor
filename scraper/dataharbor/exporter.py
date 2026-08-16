"""Exporters: CSV and JSON only (stdlib). Excel is a pandas extension point."""

from __future__ import annotations

import csv
import json
from dataclasses import asdict
from pathlib import Path
from typing import List

from .cleaner import CleanRecord

EXPORT_DIR = Path(__file__).resolve().parents[2] / "data" / "exports"

_FIELDS = [
    "business_name",
    "category",
    "website",
    "email",
    "phone",
    "city",
    "country",
    "rating",
    "review_count",
    "description",
    "source_url",
    "validation_status",
]


def _ensure_dir() -> None:
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def _row(rec: CleanRecord, validation_status: str = "VALID") -> dict:
    d = asdict(rec)
    d["country"] = "United Kingdom"
    d["validation_status"] = validation_status
    return d


def export_csv(records: List[CleanRecord], filename: str, validation_statuses: List[str] | None = None) -> Path:
    _ensure_dir()
    out = EXPORT_DIR / filename
    statuses = validation_statuses or ["VALID"] * len(records)
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=_FIELDS)
        writer.writeheader()
        for rec, status in zip(records, statuses):
            writer.writerow(_row(rec, status))
    return out


def export_json(records: List[CleanRecord], filename: str, validation_statuses: List[str] | None = None) -> Path:
    _ensure_dir()
    out = EXPORT_DIR / filename
    statuses = validation_statuses or ["VALID"] * len(records)
    rows = [_row(r, s) for r, s in zip(records, statuses)]
    out.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    return out
