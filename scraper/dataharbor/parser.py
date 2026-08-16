"""HTML parser — pulls listing fields out of the demo directory pages.

We use stdlib only (``html.parser.HTMLParser``) so the project has no third-
party scraping dependencies. Production version typically uses BeautifulSoup or
selectolax for speed and richer CSS selectors.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import List, Optional


@dataclass
class RawRecord:
    business_name: Optional[str] = None
    category: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    rating: Optional[str] = None
    review_count: Optional[str] = None
    description: Optional[str] = None
    source_url: Optional[str] = None


class _ListingParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.records: List[RawRecord] = []
        self._cur: Optional[RawRecord] = None
        self._capture_to: Optional[str] = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        cls = a.get("class") or ""
        if tag == "article" and "listing" in cls:
            self._cur = RawRecord()
        elif self._cur is None:
            return
        elif tag == "h2" and "biz-name" in cls:
            self._capture_to = "business_name"
        elif tag == "span" and "cat" in cls:
            self._capture_to = "category"
        elif tag == "p" and "desc" in cls:
            self._capture_to = "description"
        elif tag == "a" and "email" in cls:
            href = a.get("href") or ""
            self._cur.email = href.replace("mailto:", "").strip()
        elif tag == "a" and "site" in cls:
            self._cur.website = (a.get("href") or "").strip()
        elif tag == "span" and "phone" in cls:
            self._capture_to = "phone"
        elif tag == "span" and "city" in cls:
            self._capture_to = "city"
        elif tag == "span" and "rating" in cls:
            self._cur.rating = a.get("data-score") or ""
            self._capture_to = "rating_text"
        elif tag == "span" and "reviews" in cls:
            self._capture_to = "review_count"
        elif tag == "a" and "permalink" in cls:
            self._cur.source_url = (a.get("href") or "").strip()

    def handle_data(self, data: str) -> None:
        if self._cur is None or self._capture_to is None:
            return
        text = data.strip()
        if not text:
            return
        if self._capture_to == "rating_text":
            # rating already captured from data-score; ignore visible text.
            pass
        else:
            cur_val = getattr(self._cur, self._capture_to, None) or ""
            setattr(self._cur, self._capture_to, (cur_val + " " + text).strip() if cur_val else text)
        self._capture_to = None

    def handle_endtag(self, tag: str) -> None:
        if tag == "article" and self._cur is not None:
            self.records.append(self._cur)
            self._cur = None
            self._capture_to = None


def parse(html: str) -> List[RawRecord]:
    p = _ListingParser()
    p.feed(html)
    return p.records


def find_next_page_href(html: str) -> Optional[str]:
    """Return the rel=next link href if present, else None."""
    parser = _NextLinkFinder()
    parser.feed(html)
    return parser.next_href


class _NextLinkFinder(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.next_href: Optional[str] = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "a":
            return
        a = dict(attrs)
        if a.get("rel") == "next":
            self.next_href = a.get("href")
