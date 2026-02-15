"""
Reads charts.json and outputs a simplified chart-slugs.json with just
title, slug, and chart URL.
"""

import json

with open("scripts/explore-owid/charts.json") as f:
    charts = json.load(f)

slugs = [
    {
        "title": c.get("title", ""),
        "slug": c.get("slug", ""),
        "url": f"https://ourworldindata.org/grapher/{c.get('slug', '')}",
    }
    for c in charts
]

with open("scripts/explore-owid/chart-slugs.json", "w") as f:
    json.dump(slugs, f, indent=2)

print(f"Wrote {len(slugs)} entries to scripts/explore-owid/chart-slugs.json")
