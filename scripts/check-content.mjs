// `npm run check:content`: judges the page files (src/content/pages/*.json) against the block registry, in plain words.
// Prints "Content check passed (N pages, M blocks)" or every problem, and exits 1 when there is one.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const load = (path) => import(pathToFileURL(join(root, path)).href);
const { registry } = await load("src/blocks/definitions.ts");
const { validatePages, validateRegistry } = await load("src/blocks/validate.ts");
const { readPageFiles } = await load("src/lib/page-files.ts");

const pdfs = new Set(existsSync(join(root, "public/files")) ? readdirSync(join(root, "public/files")).filter((name) => name.endsWith(".pdf")) : []);
const repo = { imageExists: (src) => existsSync(join(root, "public", src)), fileExists: (href) => pdfs.has(href.replace(/^\/files\//, "")) };
const files = readPageFiles(root);
const { catalogProblem } = await import("./blocks-catalog.mjs");
const problems = [...validateRegistry(registry, repo), ...validatePages(files, registry, repo)];
const stale = catalogProblem(registry, root);
if (stale) problems.push(stale);

if (problems.length > 0) {
  console.error(`Content check failed (${problems.length}):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exitCode = 1;
} else {
  const blocks = files.reduce((sum, { data }) => sum + (Array.isArray(data?.blocks) ? data.blocks.length : 0), 0);
  console.log(`Content check passed (${files.length} pages, ${blocks} blocks)`);
}
