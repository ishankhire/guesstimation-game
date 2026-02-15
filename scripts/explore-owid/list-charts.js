/**
 * list-charts.js
 * Fetches all charts from the OWID Search API and writes them to charts.json
 *
 * Usage: node list-charts.js [--output charts.json]
 *
 * API docs: https://docs.owid.io/projects/etl/api/search-api/
 */

const BASE_URL = "https://ourworldindata.org/api/search";
const HITS_PER_PAGE = 100;

async function fetchPage(page) {
  const url = `${BASE_URL}?type=charts&hitsPerPage=${HITS_PER_PAGE}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
  return res.json();
}

async function fetchAllCharts() {
  console.log("Fetching page 0 to get total count...");
  const first = await fetchPage(0);

  const totalPages = first.nbPages ?? Math.ceil(first.nbHits / HITS_PER_PAGE);
  const totalHits = first.nbHits;
  console.log(`Total charts: ${totalHits}, pages: ${totalPages}`);

  const allCharts = [...first.results];

  for (let page = 1; page < totalPages; page++) {
    process.stdout.write(`\rFetching page ${page + 1}/${totalPages}...`);
    const data = await fetchPage(page);
    allCharts.push(...data.results);
  }

  console.log(`\nDone. Fetched ${allCharts.length} charts.`);
  return allCharts;
}

async function main() {
  const outputArg = process.argv.indexOf("--output");
  const outputFile = outputArg !== -1 ? process.argv[outputArg + 1] : "charts.json";

  const charts = await fetchAllCharts();

  // Print a summary table to stdout
  console.log("\nSample (first 20):");
  console.log("─".repeat(80));
  for (const c of charts.slice(0, 20)) {
    const title = (c.title ?? "").slice(0, 60).padEnd(60);
    const slug = c.slug ?? "";
    console.log(`${title}  ${slug}`);
  }
  console.log("─".repeat(80));
  console.log(`\nWriting all ${charts.length} charts to ${outputFile}...`);

  const fs = await import("fs");
  fs.writeFileSync(outputFile, JSON.stringify(charts, null, 2));
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
