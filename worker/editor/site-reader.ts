import { fileForPath, pathForFile, type AnyBlockDefinition } from "../../src/blocks/schema.ts";
import type { PageFile } from "../../src/blocks/validate.ts";
import type { Palette } from "../../src/brand/contrast-pairs.ts";
import { fontsModule, type FontRole } from "../../src/brand/fonts.ts";
import { FONTS_PATH, GENERATED_BRAND_FILES, PALETTE_PATH } from "../../src/brand/generated.ts";
import { paletteCss } from "../../src/brand/palette.ts";
import { COLLECTION_KINDS, ITEM_DIR, itemFilePath, SLUG_RE, type ItemFile } from "../../src/collections/schema.ts";
import { SITE_SETTINGS_NAMES, settingsPath, validateSite, type SettingsName } from "../../src/collections/site-validate.ts";
import type { GitHub } from "./github.ts";
import { isObject } from "./json.ts";

/** Reads the site's page files, collection items and settings files from `main` and judges a changed set of them with the build's own validator. */

const PAGES_DIR = "src/content/pages";
const IMAGES_DIR = "public/images";
const FILES_DIR = "public/files";
const FILE_BLOB = /^public\/files\/[^/]+\.pdf$/;
const PAGE_FILE = /^src\/content\/pages\/[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?\.json$/; // two levels: a -- is the / (D2)
const ITEM_FILE = new RegExp(`^${ITEM_DIR}/(${COLLECTION_KINDS.join("|")})/([a-z0-9]+(?:-[a-z0-9]+)*)\\.json$`);
const UPLOAD_PHOTO = /^public\/images\/uploads\/[a-z0-9]{8}\.webp$/;
const UPLOAD_PDF = /^public\/files\/[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/;
/** The files a brand change regenerates from brand.json. */
export { FONTS_PATH, PALETTE_PATH };

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
  /** PDF paths as pages write them: /files/x.pdf (top level of public/files only). */
  files: Set<string>;
  /** Collection items by "<collection>/<slug>". */
  items: Map<string, unknown>;
  /** Item files that would not parse. */
  itemBroken: ItemFile[];
  /** The three settings files, parsed (a missing or unreadable file is absent). */
  settings: Map<string, unknown>;
  settingsErrors: Partial<Record<SettingsName, string>>;
  pagesTree: string;
  imagesTree: string;
  filesTree: string;
  /** The git tree of src/content/collections ("none" when the folder does not exist). */
  collectionsTree: string;
  /** The blob sha of each settings file ("none" when missing). */
  settingsShas: Record<SettingsName, string>;
}

/** The items and settings a change would put in place of the snapshot's. */
export interface Documents {
  items: ReadonlyMap<string, unknown>;
  settings: ReadonlyMap<string, unknown>;
}

/** Files a change would add: image values and PDF values as pages write them, and each new photo's upload name. */
export interface Pending {
  images: ReadonlySet<string>;
  files: ReadonlySet<string>;
  names: ReadonlyMap<string, string>;
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
    files: new Set(),
    items: new Map(),
    itemBroken: [],
    settings: new Map(),
    settingsErrors: {},
    pagesTree: entries.find((e) => e.type === "tree" && e.path === PAGES_DIR)?.sha ?? "none",
    imagesTree: entries.find((e) => e.type === "tree" && e.path === IMAGES_DIR)?.sha ?? "none",
    filesTree: entries.find((e) => e.type === "tree" && e.path === FILES_DIR)?.sha ?? "none",
    collectionsTree: entries.find((e) => e.type === "tree" && e.path === ITEM_DIR)?.sha ?? "none",
    settingsShas: { business: "none", brand: "none", notice: "none" },
  };
  for (const entry of entries) {
    if (entry.type === "blob" && entry.path.startsWith(`${IMAGES_DIR}/`)) snapshot.images.add(entry.path.slice("public".length));
    if (entry.type === "blob" && FILE_BLOB.test(entry.path)) snapshot.files.add(entry.path.slice("public".length));
  }
  const files = entries.filter((e) => e.type === "blob" && PAGE_FILE.test(e.path)).map((e) => e.path);
  const itemPaths = entries.filter((e) => e.type === "blob" && ITEM_FILE.test(e.path)).map((e) => e.path);
  const settingNames = SITE_SETTINGS_NAMES.filter((name) => entries.some((e) => e.type === "blob" && e.path === settingsPath(name)));
  for (const name of settingNames) snapshot.settingsShas[name] = entries.find((e) => e.type === "blob" && e.path === settingsPath(name))?.sha ?? "none";
  const [texts, itemTexts, settingTexts] = await Promise.all([
    Promise.all(files.map((path) => github.fileAt(head.commit, path))),
    Promise.all(itemPaths.map((path) => github.fileAt(head.commit, path))),
    Promise.all(settingNames.map((name) => github.fileAt(head.commit, settingsPath(name)))),
  ]);
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
  itemPaths.forEach((path, i) => {
    const [, kind, slug] = ITEM_FILE.exec(path) ?? [];
    try {
      snapshot.items.set(`${kind}/${slug}`, JSON.parse(itemTexts[i] ?? ""));
    } catch {
      snapshot.itemBroken.push({ kind, slug, data: null, error: "this file is not valid JSON, so the site cannot read it." });
    }
  });
  settingNames.forEach((name, i) => {
    try {
      snapshot.settings.set(name, JSON.parse(settingTexts[i] ?? ""));
    } catch {
      snapshot.settingsErrors[name] = "is not valid JSON, so the site cannot read it.";
    }
  });
  return snapshot;
}

/** Plain-words problems with the whole site as it would be after a change: pages, items and settings, judged by the build's own validator. */
export function validateSet(
  snapshot: Snapshot,
  after: ReadonlyMap<string, unknown>,
  registry: readonly AnyBlockDefinition[],
  links: ThanksLinks,
  pending?: Pending,
  documents: Documents = snapshot,
): string[] {
  const files: PageFile[] = [...snapshot.broken];
  for (const [path, data] of after) files.push({ file: snapshot.fileOf.get(path) ?? fileForPath(path), data });
  const items: ItemFile[] = [...snapshot.itemBroken];
  for (const [key, data] of documents.items) {
    const at = key.indexOf("/");
    items.push({ kind: key.slice(0, at), slug: key.slice(at + 1), data });
  }
  return validateSite(
    {
      pages: files,
      items,
      business: documents.settings.get("business"),
      brand: documents.settings.get("brand"),
      notice: documents.settings.get("notice"),
      settingsErrors: snapshot.settingsErrors,
    },
    registry,
    {
      imageExists: (src) => snapshot.images.has(src) || (pending?.images.has(src) ?? false),
      fileExists: (href) => snapshot.files.has(href) || (pending?.files.has(href) ?? false),
    },
    { links, ...(pending && pending.names.size > 0 ? { uploadNames: pending.names } : {}) },
  );
}

/** The files to commit for the pages a change touched. */
export function filesFor(snapshot: Snapshot, after: ReadonlyMap<string, unknown>, touched: readonly string[]): { path: string; content: string }[] {
  return touched.flatMap((path) => {
    const page = after.get(path);
    return page === undefined ? [] : [{ path: pageFilePath(snapshot.fileOf.get(path) ?? fileForPath(path)), content: serializePage(page) }];
  });
}

/** The files to commit for the items a change touched: status first, then the fields as written. */
export function itemFilesFor(after: ReadonlyMap<string, unknown>, touched: readonly string[]): { path: string; content: string }[] {
  return touched.flatMap((key) => {
    const item = after.get(key);
    if (!isObject(item)) return [];
    const at = key.indexOf("/");
    const { status, ...fields } = item;
    return [{ path: itemFilePath(key.slice(0, at), key.slice(at + 1)), content: serializePage({ status, ...fields }) }];
  });
}

/** The files to commit for the settings a change touched; a brand change also regenerates the palette and the fonts module. */
export function settingsFilesFor(after: ReadonlyMap<string, unknown>, touched: readonly string[]): { path: string; content: string }[] {
  const out: { path: string; content: string }[] = [];
  for (const name of SITE_SETTINGS_NAMES) {
    const data = after.get(name);
    if (!touched.includes(name) || data === undefined) continue;
    out.push({ path: settingsPath(name), content: serializePage(data) });
    if (name === "brand" && isObject(data)) {
      out.push({ path: PALETTE_PATH, content: paletteCss(data.colors as Palette) }, { path: FONTS_PATH, content: fontsModule(data.fonts as Record<FontRole, string>) });
    }
  }
  return out;
}

/**
 * The only paths an editor commit may write: a page file, an item file (known kind, real slug), a settings file, a generated
 * brand file, or an uploaded photo or PDF. A defence in depth: the operations already build these paths, and anything else is refused.
 */
export function isCommittablePath(path: string): boolean {
  const item = ITEM_FILE.exec(path);
  if (item !== null) return SLUG_RE.test(item[2] ?? "");
  return PAGE_FILE.test(path) || settingNameOf(path) !== null || GENERATED_BRAND_FILES.includes(path) || UPLOAD_PHOTO.test(path) || UPLOAD_PDF.test(path);
}

/** "<collection>/<slug>" for an item file's repo path, or null. */
export function itemKeyOf(path: string): string | null {
  const found = ITEM_FILE.exec(path);
  return found ? `${found[1]}/${found[2]}` : null;
}

/** The settings name for a settings file's repo path, or null. */
export const settingNameOf = (path: string): SettingsName | null => SITE_SETTINGS_NAMES.find((name) => settingsPath(name) === path) ?? null;
