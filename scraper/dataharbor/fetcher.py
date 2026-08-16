"""Fetcher — read pages from disk (demo) or HTTP (production).

For the portfolio demo, sources are local files. The same interface accepts a
URL and could be backed by `requests` for live scraping. We retry transient
failures up to ``retries`` times before giving up.
"""

from __future__ import annotations

import time
from pathlib import Path


class FetchError(Exception):
    pass


def fetch(path_or_url: str, retries: int = 3, backoff: float = 0.2) -> str:
    """Return the HTML for a local file or URL. Retries with backoff."""
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            p = Path(path_or_url)
            if p.exists():
                return p.read_text(encoding="utf-8")
            # Live HTTP path is intentionally unimplemented in the portfolio
            # build; production swaps in `requests.get(...).text` here.
            raise FetchError(f"Path not found: {path_or_url}")
        except Exception as exc:  # pragma: no cover - exercised via mock retries
            last_err = exc
            time.sleep(backoff * (2 ** attempt))
    raise FetchError(f"Could not fetch {path_or_url} after {retries} attempts: {last_err}")
