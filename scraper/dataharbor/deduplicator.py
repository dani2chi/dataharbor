"""Deduplication.

Two records are duplicates if they share *any* of: website URL, email,
phone, or (business name + city). When duplicates exist we keep the record
with the highest review count (most "evidence"), tagging the discards.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

from .cleaner import CleanRecord


@dataclass
class DedupeResult:
    kept: List[CleanRecord]
    discarded: List[Tuple[CleanRecord, str]]


def _keys(rec: CleanRecord) -> List[str]:
    keys: List[str] = []
    if rec.website:
        keys.append(f"site::{rec.website.lower()}")
    if rec.email:
        keys.append(f"email::{rec.email.lower()}")
    if rec.phone:
        keys.append(f"phone::{rec.phone.replace(' ', '')}")
    keys.append(f"name+city::{rec.business_name.lower()}::{rec.city.lower()}")
    return keys


def dedupe(records: List[CleanRecord]) -> DedupeResult:
    seen: dict[str, CleanRecord] = {}
    kept: List[CleanRecord] = []
    discarded: List[Tuple[CleanRecord, str]] = []

    for rec in records:
        match = None
        match_key = None
        for k in _keys(rec):
            if k in seen:
                match = seen[k]
                match_key = k
                break
        if match is None:
            for k in _keys(rec):
                seen[k] = rec
            kept.append(rec)
        else:
            current_score = (rec.review_count or 0)
            kept_score = (match.review_count or 0)
            if current_score > kept_score:
                # swap: prefer the new one
                kept = [r for r in kept if r is not match]
                kept.append(rec)
                for k in _keys(match):
                    seen.pop(k, None)
                for k in _keys(rec):
                    seen[k] = rec
                discarded.append((match, f"Duplicate of {rec.business_name} (matched on {match_key})"))
            else:
                discarded.append((rec, f"Duplicate of {match.business_name} (matched on {match_key})"))
    return DedupeResult(kept=kept, discarded=discarded)
