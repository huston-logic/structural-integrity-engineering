import { fileForPath, pathForFile, type AnyBlockDefinition } from "../../src/blocks/schema.ts";
import { validatePages, type PageFile } from "../../src/blocks/validate.ts";
import type { GitHub } from "./github.ts";

/** Reads the site's page files from `main` and judges a changed set of pages with the build's own validator. */

const PAGES_DIR = "src/content/pages";
const IMAGES_DIR = "public/images";
const PAGE_FILE = /^src\/content\/pages\/[^/]+\.json$/;

export type ThanksLinks = readonly { where: string; href: string }[];

export interface Snapshot {
  commit: string;
  tree: string;
  /** Parsed pages by path. */
  pages: Map<string, unknown>;
  /** The page file name for each path. */
  fileOf: Map<string, string>;
  /** Files that would not parse, so the validator can name them. */
  broken: PageFile[];
  /** Image paths as pages write them: /images/... */
  images: Set<string>;
  pagesTree: string;
  imagesTree: string;
}

export const isPageFile = (path: string): boolean => PAGE_FILE.test(path);
export const pageFilePath = (file: string): string => `${PAGES_DIR}/${file}`;
export const serializePage = (page: unknown): string => JSON.stringify(page, null, 2) + "\n";

export async function readSite(github: GitHub): Promise<Snapshot> {
  const head = await github.headOfMain();
  const entries = await github.tree(head.tree);
  const snapshot: Snapshot = {
    commit: head.commit,
    tree: head.tree,
    pages: new Map(),
    fileOf: new Map(),
    broken: [],
    images: new Set(),
    pagesTree: entries.find((e) => e.type === "tree" && e.path === PAGES_DIR)?.sha ?? "none",
    imagesTree: entries.find((e) => e.type === "tree" && e.path === IMAGES_DIR)?.sha ?? "none",
  };
  for (const entry of entries) {
    if (entry.type === "blob" && entry.path.startsWith(`${IMAGES_DIR}/`)) snapshot.images.add(entry.path.slice("public".length));
  }
  const files = entries.filter((e) => e.type === "blob" && PAGE_FILE.test(e.path)).map((e) => e.path);
  const texts = await Promise.all(files.map((path) => github.fileAt(head.commit, path)));
  files.forEach((path, i) => {
    const file = path.slice(PAGES_DIR.length + 1);
    try {
      const data: unknown = JSON.parse(texts[i] ?? "");
      const own = typeof data === "object" && data !== null && "path" in data && typeof data.path === "string" ? data.path : pathForFile(file);
      snapshot.pages.set(own, data);
      snapshot.fileOf.set(own, file);
    } catch {
      snapshot.broken.push({ file, data: null, error: "this file is not valid JSON, so the site cannot read it." });
    }
  });
  return snapshot;
}

/** Plain-words problems with a whole page set (the pages as they would be after a change). */
export function validateSet(
  snapshot: Snapshot,
  after: ReadonlyMap<string, unknown>,
  registry: readonly AnyBlockDefinition[],
  links: ThanksLinks,
): string[] {
  const files: PageFile[] = [...snapshot.broken];
  for (const [path, data] of after) files.push({ file: snapshot.fileOf.get(path) ?? fileForPath(path), data });
  return validatePages(files, registry, { imageExists: (src) => snapshot.images.has(src) }, { links });
}

/** The files to commit for the pages a change touched. */
export function filesFor(snapshot: Snapshot, after: ReadonlyMap<string, unknown>, touched: readonly string[]): { path: string; content: string }[] {
  return touched.flatMap((path) => {
    const page = after.get(path);
    return page === undefined ? [] : [{ path: pageFilePath(snapshot.fileOf.get(path) ?? fileForPath(path)), content: serializePage(page) }];
  });
}
