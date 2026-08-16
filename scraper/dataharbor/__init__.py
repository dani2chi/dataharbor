"""DataHarbor — business listing extraction pipeline.

Modules:
    fetcher      load HTML pages with retries
    parser       extract listing fields from HTML
    cleaner      normalize whitespace, phones, emails, URLs
    validator    flag missing or malformed fields
    deduplicator collapse duplicate records
    exporter     write CSV / Excel / JSON
    runner       orchestrate end-to-end
"""

__version__ = "1.0.0"
