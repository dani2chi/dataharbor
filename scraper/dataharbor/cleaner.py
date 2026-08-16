"""Normalize raw extracted fields into clean, comparable values."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

from .parser import RawRecord

_WS = re.compile(r"\s+")
_TRACKING_PARAMS = re.compile(r"[?&](utm_[^=&]+|gclid|fbclid)=[^&]*")


@dataclass
class CleanRecord:
    business_name: str
    category: str
    website: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    city: str
    rating: Optional[float]
    review_count: Optional[int]
    description: Optional[str]
    source_url: str


def _norm_str(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    return _WS.sub(" ", s).strip() or None


def _norm_phone(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    digits = re.sub(r"[^0-9+]", " ", s)
    return _WS.sub(" ", digits).strip() or None


def _norm_email(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    return s.strip().lower() or None


def _norm_url(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    cleaned = _TRACKING_PARAMS.sub("", s.strip())
    return cleaned.rstrip("?&").rstrip("/") or None


def _to_float(s: Optional[str]) -> Optional[float]:
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _review_count(s: Optional[str]) -> Optional[int]:
    if not s:
        return None
    m = re.search(r"(\d+)", s)
    return int(m.group(1)) if m else None


def clean(raw: RawRecord) -> Optional[CleanRecord]:
    name = _norm_str(raw.business_name)
    src = _norm_str(raw.source_url)
    if not name or not src:
        return None
    return CleanRecord(
        business_name=name,
        category=_norm_str(raw.category) or "Uncategorised",
        website=_norm_url(raw.website),
        email=_norm_email(raw.email),
        phone=_norm_phone(raw.phone),
        city=_norm_str(raw.city) or "Unknown",
        rating=_to_float(raw.rating),
        review_count=_review_count(raw.review_count),
        description=_norm_str(raw.description),
        source_url=src,
    )
