// Change report: before and after screenshots of the pages a change touches, at phone and desktop width, plus the scope
// check's verdict, written to change-report/report.md. Run with `npm run report:changes` after `npm run build`.
//
//   node scripts/change-report.mjs [--base origin/main] [--head HEAD] [--ci]
//                                  [--base-out <dir>] [--head-out out] [--out change-report]
//
// "After" is the site in --head-out (your build of this branch). "Before" is --base-out if you have one; otherwise the
// script builds the base commit in a temporary git worktree (npm ci + npm run build, a minute or two) and removes it.
// Playwright is already a dev dependency, so nothing new is installed; if its Chromium is missing it falls back to the
// installed Google Chrome. Screenshots are informational: this script never blocks a merge (scripts/check-change-scope.mjs does).
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { decide, evaluateChange, fence, formatReport, gatherChange, parseArgs, realGit, safe } from "./check-change-scope.mjs";
import { rules } from "./change-scope-rules.mjs";
import { startPreviewServer } from "./preview.mjs";

export const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

const root = new URL("..", import.meta.url).pathname;

// ---- which pages does a change touch? (pure) --------------------------------------------------------------------

/** "src/app/(site)/about/page.tsx" becomes "/about"; the home page is "/"; anything else is null. */
export function routeForPageFile(path) {
  const match = /^src\/app\/\(site\)\/(?:(.+)\/)?page\.tsx$/.exec(path);
  return match ? (match[1] ? `/${match[1]}` : "/") : null;
}

export const slugForRoute = (route) => (route === "/" ? "home" : route.slice(1).replace(/\//g, "-"));

const quoted = (text, spec) => text.includes(`"${spec}"`) || text.includes(`'${spec}'`);

/** The source files (keys of `sources`) that import `path`, or, for a photo, mention its URL. */
export function findImporters(path, sources) {
  if (path.startsWith("public/")) {
    const url = path.slice("public".length);
    return Object.keys(sources).filter((other) => sources[other].includes(url));
  }
  if (!path.startsWith("src/")) return [];
  const withoutExtension = path.replace(/\.(tsx?|jsx?|mjs)$/, "");
  const alias = `@/${withoutExtension.slice("src/".length)}`;
  return Object.keys(sources).filter((other) => {
    if (other === path) return false;
    let relativeSpec = posix.relative(posix.dirname(other), withoutExtension);
    if (!relativeSpec.startsWith(".")) relativeSpec = `./${relativeSpec}`;
    return quoted(sources[other], alias) || quoted(sources[other], relativeSpec);
  });
}

/** Follows imports upward until it reaches pages. `all` is true when it reaches the shared layout or cannot tell. */
function reachablePages(path, sources, pageRoutes) {
  const routes = new Set();
  const seen = new Set([path]);
  const queue = [path];
  let first = true;
  while (queue.length > 0) {
    const importers = findImporters(queue.shift(), sources);
    if (first && importers.length === 0) return { all: true, routes };
    first = false;
    for (const importer of importers) {
      if (seen.has(importer)) continue;
      seen.add(importer);
      if (pageRoutes[importer]) routes.add(pageRoutes[importer]);
      else if (importer.startsWith("src/app/")) return { all: true, routes };
      else queue.push(importer);
    }
  }
  return { all: false, routes };
}

/** Files that cannot change how a page looks. */
const NO_VISUAL_EFFECT = /^(?:docs|scripts|tests|\.github|\.claude)\/|\.md$|^src\/lib\/routes\.ts$/;

/**
 * Which pages to screenshot. `files` is [{ status, path }], `sources` maps src/ file paths to their text, `pageRoutes`
 * maps page files to routes and `allRoutes` lists every route. Returns [{ route, slug, before, after, reason }].
 */
export function affectedPages({ files, sources, pageRoutes, allRoutes }) {
  const added = new Set();
  const deleted = new Set();
  const reasons = new Map();
  const mark = (route, reason) => reasons.has(route) || reasons.set(route, reason);
  for (const { status, path } of files) {
    const own = routeForPageFile(path);
    if (own) {
      if (status === "A") added.add(own);
      if (status === "D") deleted.add(own);
      mark(own, status === "A" ? "new page" : status === "D" ? "page deleted" : `${path} changed`);
    } else if (!NO_VISUAL_EFFECT.test(path)) {
      const reach = reachablePages(path, sources, pageRoutes);
      if (reach.all) for (const route of allRoutes) mark(route, `${path} changed (it reaches every page)`);
      else for (const route of reach.routes) mark(route, `${path} changed`);
    }
  }
  return [...reasons.keys()].sort().map((route) => ({ route, slug: slugForRoute(route), before: !added.has(route), after: !deleted.has(route), reason: reasons.get(route) }));
}

// ---- options and markdown (pure) --------------------------------------------------------------------------------

/** Splits this script's own options from the ones check-change-scope's parseArgs understands. */
export function extractOptions(argv) {
  const options = { baseOut: undefined, out: "change-report", headOut: "out" };
  const keys = { "--base-out": "baseOut", "--out": "out", "--head-out": "headOut" };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (Object.hasOwn(keys, argv[i])) {
      if (argv[i + 1] === undefined || argv[i + 1].startsWith("--")) return { error: `${argv[i]} needs a value` };
      options[keys[argv[i]]] = argv[i + 1];
      i += 1;
    } else rest.push(argv[i]);
  }
  return { options, rest };
}

export function buildReportMarkdown({ scopeText, base, head, pages, viewports }) {
  const sizes = viewports.map((v) => `${v.name} ${v.width} × ${v.height}`).join(", ");
  const lines = ["# Change report", "", `Compared ${safe(base)}...${safe(head)}.`, "", "## Scope check", "", fence(scopeText), ""];
  if (pages.length === 0) return [...lines, "## Pages", "", "No visible page is affected by this change, so there are no screenshots.", ""].join("\n");
  lines.push(`## Pages (${pages.length})`, "", `Screenshots at ${sizes}.`, "");
  for (const page of pages) {
    lines.push(`### ${page.route}`, "", `Why: ${page.reason}.`, "");
    lines.push("| | Before | After |", "| --- | --- | --- |");
    for (const v of viewports) {
      const cell = (side, present, missing) => (present ? `![${side}, ${v.name}](${page.slug}/${side}-${v.name}.png)` : missing);
      lines.push(`| ${v.name} (${v.width} × ${v.height}) | ${cell("before", page.before, "new page, no before")} | ${cell("after", page.after, "page deleted, no after")} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ---- building, serving and photographing the two sites ---------------------------------------------------------

function readSources() {
  const sources = {};
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name)) sources[relative(root, full).split("\\").join("/")] = readFileSync(full, "utf8");
    }
  };
  walk(join(root, "src"));
  return sources;
}

function readRoutes() {
  const text = readFileSync(join(root, "src/lib/routes.ts"), "utf8");
  return [...new Set([...text.matchAll(/["'](\/[a-z0-9/-]*)["']/g)].map((m) => m[1]))];
}

function buildBaseSite(base, head, log) {
  const mergeBase = String(realGit(["merge-base", base, head])).trim();
  const dir = mkdtempSync(join(tmpdir(), "change-report-base-"));
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    try {
      realGit(["worktree", "remove", "--force", dir]);
    } catch {
      // git never registered the folder (for example `worktree add` failed): remove the empty folder ourselves.
      rmSync(dir, { recursive: true, force: true });
      log(`Cleaned up the temporary folder ${dir}. If \`git worktree list\` still shows it, run: git worktree prune`);
    }
  };
  log(`Building the "before" site from ${mergeBase.slice(0, 8)} in a temporary folder (a minute or two)...`);
  try {
    realGit(["worktree", "add", "--detach", dir, mergeBase]);
    execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: dir, stdio: "inherit" });
    execFileSync("npm", ["run", "build"], { cwd: dir, stdio: "inherit" });
  } catch (error) {
    // Also reached by Ctrl-C: the install or build child dies, execFileSync throws, and the temporary folder is removed.
    cleanup();
    throw error;
  }
  return { outDir: join(dir, "out"), cleanup };
}

async function openBrowser() {
  const { chromium } = await import("@playwright/test");
  try {
    return await chromium.launch();
  } catch {
    try {
      return await chromium.launch({ channel: "chrome" });
    } catch {
      throw new Error("Could not open a browser. Install one with `npx playwright install chromium` (ask Grant first) or install Google Chrome.");
    }
  }
}

/** Screenshots every page on both sides at both widths. Sets a page's before/after to false when the page is not there. */
async function takeScreenshots({ beforeDir, afterDir, pages, outDir, log }) {
  const servers = {};
  let browser;
  try {
    // Everything that is opened is closed in the finally below, even when a later step (the browser) fails to start.
    servers.before = await startPreviewServer({ outDir: beforeDir, port: 0 });
    servers.after = await startPreviewServer({ outDir: afterDir, port: 0 });
    browser = await openBrowser();
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce", hasTouch: viewport.name === "phone" });
      for (const side of ["before", "after"]) {
        for (const page of pages.filter((p) => p[side])) {
          const tab = await context.newPage();
          const response = await tab.goto(`http://localhost:${servers[side].port}${page.route}`, { waitUntil: "networkidle" });
          if (!response || response.status() !== 200) {
            page[side] = false;
          } else {
            await tab.evaluate(() => document.fonts.ready);
            mkdirSync(join(outDir, page.slug), { recursive: true });
            await tab.screenshot({ path: join(outDir, page.slug, `${side}-${viewport.name}.png`), fullPage: true });
            log(`  ${side} ${viewport.name}: ${page.route}`);
          }
          await tab.close();
        }
      }
      await context.close();
    }
  } finally {
    await browser?.close();
    await Promise.all(Object.values(servers).map((server) => server.close()));
  }
}

/** Returns the exit code: 0 done, 2 could not run. */
export async function main({ argv, env = process.env, log = console.log }) {
  const split = extractOptions(argv);
  const args = split.error ? { error: split.error } : parseArgs(split.rest, env);
  if (args.error) {
    log(`Change report could not run: ${args.error}`);
    return 2;
  }
  if (args.skip) {
    log(args.skip.replace("Change scope check", "Change report"));
    return 0;
  }
  const { options } = split;
  const outDir = resolve(options.out);
  const headDir = resolve(options.headOut);
  if (!existsSync(join(headDir, "index.html"))) {
    log(`Change report could not run: there is no build in ${options.headOut}. Run \`npm run build\` first.`);
    return 2;
  }

  let change;
  try {
    change = gatherChange({ base: args.base, head: args.head, git: realGit });
  } catch (error) {
    log(`Change report could not read the git history: ${safe(error.stderr?.toString().trim() || error.message)}`);
    return 2;
  }
  log(`Using the build in ${options.headOut} (built ${statSync(join(headDir, "index.html")).mtime.toLocaleString()}). Rebuild first if you changed anything since.`);
  const result = evaluateChange(change, rules);
  const scopeText = formatReport(result, args);
  const sources = readSources();
  const pageRoutes = Object.fromEntries(Object.keys(sources).flatMap((path) => (routeForPageFile(path) ? [[path, routeForPageFile(path)]] : [])));
  const pages = affectedPages({ files: change.files, sources, pageRoutes, allRoutes: readRoutes() });
  log(scopeText, "");
  log(`${pages.length} page(s) to photograph: ${pages.map((p) => p.route).join(", ") || "none"}`);

  mkdirSync(outDir, { recursive: true });
  let base = null;
  try {
    if (pages.length > 0) {
      base = options.baseOut ? { outDir: resolve(options.baseOut), cleanup() {} } : buildBaseSite(args.base, args.head, log);
      await takeScreenshots({ beforeDir: base.outDir, afterDir: headDir, pages, outDir, log });
    }
  } catch (error) {
    log(`Change report could not finish: ${error.message}`);
    return 2;
  } finally {
    base?.cleanup();
  }
  const markdown = buildReportMarkdown({ scopeText, base: args.base, head: args.head, pages, viewports: VIEWPORTS });
  writeFileSync(join(outDir, "report.md"), markdown);
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, `${markdown}\n_The screenshots are in the change-report artifact of this run._\n`);
  }
  log(`Report written to ${options.out}/report.md${decide(result, args.mode).ok ? "" : " (the scope check failed; see above)"}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main({ argv: process.argv.slice(2) });
}
