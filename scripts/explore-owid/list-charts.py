"""
list-charts.py
Fetches all charts from the OWID Search API and writes them to charts.json

Usage: python list-charts.py [--output charts.json]

API docs: https://docs.owid.io/projects/etl/api/search-api/
"""

import argparse
import json
import sys
import urllib.request

BASE_URL = "https://ourworldindata.org/api/search"
HITS_PER_PAGE = 100


def fetch_page(page: int) -> dict:
    url = f"{BASE_URL}?type=charts&hitsPerPage={HITS_PER_PAGE}&page={page}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; owid-chart-explorer/1.0)"},
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read())


def fetch_all_charts() -> list:
    print("Fetching page 0 to get total count...")
    first = fetch_page(0)

    total_hits = first.get("nbHits", 0)
    total_pages = first.get("nbPages", (total_hits + HITS_PER_PAGE - 1) // HITS_PER_PAGE)
    print(f"Total charts: {total_hits}, pages: {total_pages}")

    all_charts = list(first.get("results", []))

    for page in range(1, total_pages):
        print(f"\rFetching page {page + 1}/{total_pages}...", end="", flush=True)
        data = fetch_page(page)
        all_charts.extend(data.get("results", []))

    print(f"\nDone. Fetched {len(all_charts)} charts.")
    return all_charts


def main():
    parser = argparse.ArgumentParser(description="List all OWID charts")
    parser.add_argument("--output", default="charts.json", help="Output file path")
    args = parser.parse_args()

    charts = fetch_all_charts()

    # Print a sample to stdout
    print("\nSample (first 20):")
    print("─" * 80)
    for c in charts[:20]:
        title = (c.get("title") or "")[:60].ljust(60)
        slug = c.get("slug") or ""
        print(f"{title}  {slug}")
    print("─" * 80)

    print(f"\nWriting all {len(charts)} charts to {args.output}...")
    with open(args.output, "w") as f:
        json.dump(charts, f, indent=2)
    print("Done.")


if __name__ == "__main__":
    main()
