// Prints a markdown table of the median-run Lighthouse scores per page, for the CI job summary:
//   node scripts/lighthouse-summary.mjs >> "$GITHUB_STEP_SUMMARY"
// Reads .lighthouseci/manifest.json (written by `npm run test:lighthouse`); thresholds come from lighthouserc.cjs.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const config = require("../lighthouserc.cjs").ci;
const matrix = config.assert.assertMatrix;
const runsPerPage = config.collect.numberOfRuns;

/** The assertions that apply to a page: the first matrix entry whose pattern matches its address. */
const assertionsFor = (url) => matrix.find((entry) => new RegExp(entry.matchingUrlPattern).test(url))?.assertions ?? {};

const manifestPath = ".lighthouseci/manifest.json";
if (!existsSync(manifestPath)) {
  console.log("## Lighthouse\n\nNo reports were written (the run stopped before any page was audited). See the job log.");
  process.exit(0);
}

const categories = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["best-practices", "Best practices"],
  ["seo", "SEO"],
];

const runs = JSON.parse(readFileSync(manifestPath, "utf8")).filter((run) => run.isRepresentativeRun);

function cell(url, id, score) {
  const [level, options] = assertionsFor(url)[`categories:${id}`] ?? [];
  if (level === undefined) return `${Math.round(score * 100)} (not checked)`;
  const shown = Math.round(score * 100);
  if (options?.minScore === undefined || score >= options.minScore) return String(shown);
  return level === "error" ? `❌ ${shown}` : `⚠️ ${shown}`;
}

const chrome = runs[0] && /Chrome\/[\d.]+/.exec(JSON.parse(readFileSync(runs[0].jsonPath, "utf8")).environment?.hostUserAgent ?? "")?.[0];
const thresholds = categories
  .map(([id, label]) => {
    const [level, options] = matrix[0].assertions[`categories:${id}`] ?? [];
    return options?.minScore === undefined ? null : `${label} ${Math.round(options.minScore * 100)} (${level})`;
  })
  .filter(Boolean)
  .join(", ");

console.log(`## Lighthouse (mobile, median of ${runsPerPage} runs)\n`);
console.log(`Thresholds: ${thresholds}. ❌ fails the job, ⚠️ only warns. The block showcase (/blocks, noindex) has no SEO check.${chrome ? ` Browser: ${chrome}.` : ""}\n`);
console.log(`| Page | ${categories.map(([, label]) => label).join(" | ")} |`);
console.log(`|---|${categories.map(() => "---:").join("|")}|`);
for (const run of runs) {
  const path = new URL(run.url).pathname;
  console.log(`| \`${path}\` | ${categories.map(([id]) => cell(run.url, id, run.summary[id])).join(" | ")} |`);
}
console.log("\nFull HTML and JSON reports: the `lighthouse-reports` artifact on this run.");
