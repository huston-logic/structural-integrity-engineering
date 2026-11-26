// The single list of site routes. The sitemap, the accessibility check (tests/a11y) and Lighthouse CI (lighthouserc.cjs)
// all read it, so a page added as a file in src/content/pages is listed for search engines and scanned by CI.
// Plain Node (type stripping) and Playwright load this file: relative imports with .ts, no aliases, no enums.
import { THANKS_PATH } from "../blocks/schema.ts";
import { readPageFiles } from "./page-files.ts";

type RoutePage = { path: string; status?: unknown; menu?: { order?: unknown; places?: unknown } };

const live = readPageFiles()
  .flatMap(({ data, error }) => (error === undefined && typeof data === "object" && data !== null ? [data as RoutePage] : []))
  .filter((page) => page.status === "live" && typeof page.path === "string");

const orderOf = (page: RoutePage) => (typeof page.menu?.order === "number" ? page.menu.order : Number.MAX_SAFE_INTEGER);
const inMenu = (page: RoutePage, place: string) => {
  const places = page.menu?.places;
  return Array.isArray(places) && places.includes(place);
};

// 0: the home page; 1: header or footer menu pages; 2: pages only in the legal menu; 3: the rest.
const groupOf = (page: RoutePage) => (page.path === "/" ? 0 : inMenu(page, "header") || inMenu(page, "footer") ? 1 : inMenu(page, "legal") ? 2 : 3);

/** Live pages: the home page, then the header and footer menu pages by order, then the legal ones by order, then the rest by path. An archived page is left out. */
export const indexableRoutes: string[] = live
  .sort((a, b) => groupOf(a) - groupOf(b) || (groupOf(a) < 3 ? orderOf(a) - orderOf(b) : 0) || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  .map((page) => page.path);

/** The block showcase: every block and variant with its example content. Built, scanned and audited, never indexed. */
export const showcaseRoute = "/blocks";

/** Real pages that stay out of the sitemap (noindex). */
export const noindexRoutes = [THANKS_PATH, showcaseRoute];
