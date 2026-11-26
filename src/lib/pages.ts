// The site's pages, read from src/content/pages/*.json and checked with the content check. Server only (it reads files).
// An invalid page throws one error that lists every problem, so `next build` fails with plain words instead of a broken page.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { registry } from "@/blocks/definitions";
import type { MenuPlace, PageData } from "@/blocks/schema";
import { validatePages } from "@/blocks/validate";
import { readPageFiles } from "./page-files";

export type MenuItem = { label: string; href: string };

let cached: PageData[] | null = null;

function load(): PageData[] {
  const root = process.cwd();
  const files = readPageFiles(root);
  const filesDir = join(root, "public", "files");
  const pdfs = new Set(existsSync(filesDir) ? readdirSync(filesDir).filter((name) => name.endsWith(".pdf")) : []);
  const repo = { imageExists: (src: string) => existsSync(join(root, "public", src)), fileExists: (href: string) => pdfs.has(href.replace(/^\/files\//, "")) };
  const problems = validatePages(files, registry, repo);
  if (problems.length > 0) {
    throw new Error(`The page files have ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
  return files.map((file) => file.data as PageData);
}

/** Every page file, live and archived, checked. */
export function getAllPages(): PageData[] {
  if (cached) return cached;
  const pages = load();
  if (process.env.NODE_ENV === "production") cached = pages;
  return pages;
}

/** The live pages. */
export function getPages(): PageData[] {
  return getAllPages().filter((page) => page.status === "live");
}

export function getPage(path: string): PageData | undefined {
  return getPages().find((page) => page.path === path);
}

/** The links for one menu place, by order then label. Archived pages never appear. */
export function getMenu(place: MenuPlace): MenuItem[] {
  return getPages()
    .flatMap((page) => (page.menu && page.menu.places.includes(place) ? [{ label: page.menu.label, href: page.path, order: page.menu.order }] : []))
    .sort((a, b) => a.order - b.order || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0))
    .map(({ label, href }) => ({ label, href }));
}
