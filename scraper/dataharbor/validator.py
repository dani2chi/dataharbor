"""Validation rules — flag records that need human review or repair."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List

from .cleaner import CleanRecord

_EMAIL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")
_URL_RE = re.compile(r"^https?://[\w.-]+(?:/[^?#\s]*)?$")


@dataclass
class ValidationResult:
    status: str  # VALID | MISSING_EMAIL | INVALID_URL | NEEDS_REVIEW
    issues: List[str] = field(default_factory=list)


def validate(rec: CleanRecord) -> ValidationResult:
    issues: List[str] = []

    if not rec.email:
        issues.append("Missing email")
    elif not _EMAIL_RE.match(rec.email):
        issues.append(f"Invalid email format: {rec.email}")

    if not rec.website:
        issues.append("Missing website")
    elif not _URL_RE.match(rec.website):
        issues.append(f"Invalid website URL: {rec.website}")

    if rec.rating is not None and not (0 <= rec.rating <= 5):
        issues.append(f"Rating out of bounds: {rec.rating}")

    if not rec.source_url:
        issues.append("Missing source URL")

    if not issues:
        return ValidationResult(status="VALID")

    # Status priority: most user-actionable first.
    if any(i.startswith("Invalid") for i in issues):
        return ValidationResult(status="INVALID_URL", issues=issues)
    if "Missing email" in issues:
        return ValidationResult(status="MISSING_EMAIL", issues=issues)
    return ValidationResult(status="NEEDS_REVIEW", issues=issues)
