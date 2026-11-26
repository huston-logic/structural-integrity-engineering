// Content lane: prints the pages a content-only pull request touches, so a later step can scan just those pages.
// Not used by CI yet (it is the script behind a proposal).
//
//   node scripts/content-lane.mjs --ci
//
// Only inside a pull request (GITHUB_BASE_REF set): compares HEAD with the merge base of origin/<GITHUB_BASE_REF> and prints
// one line, CONTENT_LANE_ROUTES=/a,/b, when the change is content only. It prints nothing when every page must be scanned
// (or outside a pull request). Exit 0, or 2 with a message on stderr when git fails (nothing printed, so scan everything).
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { rules } from "./change-scope-rules.mjs";
import { parseRawDiff, realGit, safe } from "./check-change-scope.mjs";
import { pathForFile } from "../src/blocks/schema.ts";

/**
 * The routes to scan for a content-only change, or null for "scan every page". `files` is [{ status, path }];
 * `pagesBase` and `pagesHead` map a route to the parsed page file on each side.
 */
export function contentLaneRoutes({ files, pagesBase, pagesHead }) {
  const routes = [];
  for (const { status, path } of files) {
    if (!rules.pageFile.test(path) || ["D", "R"].includes(status)) return null;
    const route = pathForFile(path);
    const base = pagesBase[route];
    const head = pagesHead[route];
    if (!head) return null;
    if (!isDeepStrictEqual(base?.menu, head.menu)) return null;
    if (base?.menu !== undefined || head.menu !== undefined) {
      if (base?.status !== head.status) return null;
    }
    routes.push({ route, live: head.status === "live" });
  }
  const live = routes.filter((r) => r.live).map((r) => r.route);
  if (live.length === 0) return ["/"];
  return [...new Set(live)].sort();
}

/** Every page file at a git ref, parsed, keyed by route. A file that is not valid JSON is skipped (the content check reports it). */
function pagesAt(ref, git) {
  const names = String(git(["ls-tree", "--name-only", "-z", ref, "--", rules.pagesDir])).split("\0").filter((name) => rules.pageFile.test(name));
  const pages = {};
  for (const name of names) {
    try {
      const data = JSON.parse(String(git(["show", `${ref}:${name}`])).replace(/^﻿/, ""));
      if (typeof data === "object" && data !== null && !Array.isArray(data)) pages[pathForFile(name)] = data;
    } catch {
      continue;
    }
  }
  return pages;
}

/** Returns the exit code: 0, or 2 when git fails. */
export function main({ argv, env = process.env, git = realGit, out = console.log, err = console.error }) {
  if (!argv.includes("--ci") || !env.GITHUB_BASE_REF) return 0;
  try {
    const base = `origin/${env.GITHUB_BASE_REF}`;
    const mergeBase = String(git(["merge-base", base, "HEAD"])).trim();
    const files = parseRawDiff(git(["diff", "--raw", "-z", "--no-renames", `${base}...HEAD`])).map(({ status, path }) => ({ status, path }));
    const routes = contentLaneRoutes({ files, pagesBase: pagesAt(mergeBase, git), pagesHead: pagesAt("HEAD", git) });
    if (routes) out(`CONTENT_LANE_ROUTES=${routes.join(",")}`);
    return 0;
  } catch (error) {
    err(`Content lane could not read the git history: ${safe(error.stderr?.toString().trim() || error.message)}`);
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main({ argv: process.argv.slice(2) });
}
