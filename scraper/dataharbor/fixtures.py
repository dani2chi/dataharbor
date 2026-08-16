"""Generates a fake London-hotels directory as static HTML pages.

This file is the *demo source* the scraper runs against. Producing it locally
keeps the portfolio piece self-contained (no live scraping of third-party sites)
while letting the scraper do real work.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

DEMO_DIR = Path(__file__).resolve().parents[2] / "data" / "demo_source"


@dataclass
class Hotel:
    name: str
    category: str
    website: str
    email: str
    phone: str
    city: str
    rating: float
    reviews: int
    description: str
    url: str

    def as_card(self, idx: int) -> str:
        # Note: a third of cards intentionally omit the email element so the
        # scraper has something interesting to flag during validation.
        email_html = (
            f'<a class="email" href="mailto:{self.email}">{self.email}</a>'
            if idx % 3 != 0
            else ""
        )
        return f"""
        <article class="listing" id="listing-{idx}">
          <header>
            <h2 class="biz-name">{self.name}</h2>
            <span class="cat">{self.category}</span>
          </header>
          <p class="desc">{self.description}</p>
          <ul class="contact">
            <li>{email_html}</li>
            <li><a class="site" href="{self.website}" rel="nofollow">{self.website}</a></li>
            <li><span class="phone">{self.phone}</span></li>
            <li><span class="city">{self.city}</span></li>
          </ul>
          <footer>
            <span class="rating" data-score="{self.rating}">★ {self.rating:.1f}</span>
            <span class="reviews">({self.reviews} reviews)</span>
            <a class="permalink" href="{self.url}">View listing</a>
          </footer>
        </article>
        """.strip()


# Vocab pools — fictional names. Repetitions help test deduplication.
_PREFIXES = [
    "The Bramble", "Carter & Stone", "Old Hawthorn", "Ravenshaw",
    "St. Wenlock", "Dovetail", "Saltfield", "Linden Park",
    "Grosvenor Mews", "Fitz & Wickham", "Mayfair Knot", "Kingsbridge",
    "Cassington", "Holloway Lane", "Marigold Court", "Pembrook",
    "The Quill", "Beckford", "Saxon Wharf", "Holburn Yards",
]
_SUFFIXES = ["Hotel", "House", "Inn", "Boutique Hotel", "Guesthouse", "Townhouse"]
_NEIGHBOURHOODS = [
    "Bloomsbury", "Camden", "Notting Hill", "Shoreditch", "Marylebone",
    "Fitzrovia", "Holborn", "Knightsbridge", "Soho", "Covent Garden",
    "Pimlico", "Clerkenwell", "Hackney", "Islington",
]
_DESCRIPTORS = [
    "Quiet boutique stay near {n}, with a small courtyard garden and morning pastries.",
    "Family-run townhouse a short walk from {n} tube. Twelve rooms, no chain feel.",
    "Restored Georgian house in {n}; rooftop terrace, honesty bar, and slow breakfasts.",
    "Compact rooms, soft beds, and a steady kettle. Five minutes from {n} High Street.",
    "{n}'s open secret — eight rooms above a bakery, no two alike.",
    "Reliable mid-tier stay on the edge of {n}. Late check-in, no surprises.",
    "Heritage listed and recently refurbed. Walking distance to {n} station.",
]


def _slug(text: str) -> str:
    return "".join(c.lower() if c.isalnum() else "-" for c in text).strip("-")


def generate_hotels(count: int = 60, seed: int = 42) -> List[Hotel]:
    rng = random.Random(seed)
    hotels: List[Hotel] = []
    for i in range(count):
        prefix = rng.choice(_PREFIXES)
        suffix = rng.choice(_SUFFIXES)
        n = rng.choice(_NEIGHBOURHOODS)
        full = f"{prefix} {suffix}"
        slug = _slug(full)
        # Sprinkle exact duplicates and near-duplicates so dedupe is meaningful.
        if i in (12, 27, 49):
            full = hotels[i // 3].name
            slug = _slug(full)
        rating = round(rng.uniform(3.6, 4.9), 1)
        reviews = rng.randint(40, 1300)
        domain = f"{slug}.demo"
        hotel = Hotel(
            name=full,
            category="Hotels",
            website=f"https://{domain}",
            email=f"reservations@{domain}",
            phone=f"+44 20 {rng.randint(7000, 7999)} {rng.randint(1000, 9999)}",
            city=f"London — {n}",
            rating=rating,
            reviews=reviews,
            description=rng.choice(_DESCRIPTORS).format(n=n),
            url=f"https://demolocal.directory/london/hotels/{slug}",
        )
        hotels.append(hotel)
    return hotels


def _page_html(title: str, body: str, prev_href: str | None, next_href: str | None) -> str:
    nav_prev = f'<a rel="prev" href="{prev_href}">← Previous</a>' if prev_href else ""
    nav_next = f'<a rel="next" href="{next_href}">Next →</a>' if next_href else ""
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
</head>
<body>
  <main class="directory">
    <h1>{title}</h1>
    <section class="listings">
      {body}
    </section>
    <nav class="pagination">{nav_prev}{nav_next}</nav>
  </main>
</body>
</html>
"""


def write_demo_source(per_page: int = 12, count: int = 60) -> Path:
    """Write a paginated fake London-hotels directory under data/demo_source."""
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    hotels = generate_hotels(count=count)
    pages = (count + per_page - 1) // per_page
    for p in range(pages):
        chunk = hotels[p * per_page : (p + 1) * per_page]
        body = "\n".join(h.as_card(i + p * per_page) for i, h in enumerate(chunk))
        prev_href = f"page-{p}.html" if p > 0 else None
        next_href = f"page-{p + 2}.html" if p + 1 < pages else None
        html = _page_html(
            title=f"London hotels — page {p + 1} of {pages}",
            body=body,
            prev_href=prev_href,
            next_href=next_href,
        )
        out = DEMO_DIR / f"page-{p + 1}.html"
        out.write_text(html, encoding="utf-8")
    return DEMO_DIR


def list_pages() -> List[Path]:
    return sorted(DEMO_DIR.glob("page-*.html"), key=lambda p: int(p.stem.split("-")[1]))
