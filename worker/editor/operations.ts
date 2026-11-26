// Applies a proposal's operations to the page files, in memory. Pure: no I/O, and the input is never changed.
// The editor service validates the result with the build's validator; this file only refuses what an operation itself
// may not do. Block numbers and list positions are 1-based (as the owner sees them); pointers are RFC 6901 (0-based).

import { parseHex } from "../../src/brand/color.ts";
import { type Palette } from "../../src/brand/contrast-pairs.ts";
import { deriveFromBrand, nearestPassing, roleFailures, type Role } from "../../src/brand/derive.ts";
import { CURATED_FONTS, FONT_ROLES } from "../../src/brand/fonts.ts";
import { COLLECTION_KINDS, ITEM_STATUSES, RESERVED_POST_SLUGS, SLUG_RE, type CollectionKind, type ItemStatus } from "../../src/collections/schema.ts";
import { SETTINGS_NAMES, type SettingsName } from "../../src/collections/site-validate.ts";
import { BRAND_FIXED, BRAND_FIXED_MESSAGE } from "../../src/settings/names.ts";
import { isObject, type Json } from "./json.ts";
import { AGENCY_NAME } from "./words.ts";

export const MAX_OPERATIONS = 40;
export const MAX_PAGES = 5;
export const MAX_ITEMS = 10;

/** Per page path, the id of each block in order. Before ids are "<path>#<n>"; after, a surviving block keeps its id and an inserted one is null. */
export type BlockIds = { before: Map<string, string[]>; after: Map<string, (string | null)[]> };

type Block = { type: string; variant?: string; anchor?: string; content: unknown };

/** Exactly one of these names what a set, insert_item or remove_item changes. */
type Target = { page: string } | { item: string } | { settings: SettingsName };

export type Operation =
  | ({ op: "set"; pointer: string; value: unknown } & Target)
  | ({ op: "insert_item"; pointer: string; at: number; value: unknown } & Target)
  | ({ op: "remove_item"; pointer: string; at: number } & Target)
  | { op: "insert_block"; page: string; at: number; block: Block }
  | { op: "move_block"; page: string; from: number; to: number }
  | { op: "remove_block"; page: string; block: number }
  | { op: "add_page"; page: Record<string, unknown> }
  | { op: "archive_page"; page: string }
  | { op: "restore_page"; page: string }
  | { op: "add_item"; collection: CollectionKind; slug: string; item: Record<string, unknown> }
  | { op: "set_item_status"; item: string; status: ItemStatus }
  | { op: "set_brand_color"; role: Role; value: string }
  | { op: "set_font"; role: "display" | "body" | "accent"; font: string };

/** The items ("posts/<slug>") and settings files ("business", "brand", "notice") a proposal may change, with the pages. */
export interface Documents {
  items: ReadonlyMap<string, unknown>;
  settings: ReadonlyMap<string, unknown>;
}

export type ApplyResult =
  | {
      ok: true;
      after: Map<string, unknown>;
      touched: string[];
      moved: string[];
      ids: BlockIds;
      items: Map<string, unknown>;
      settings: Map<string, unknown>;
      touchedItems: string[];
      touchedSettings: string[];
    }
  | { ok: false; problems: string[] };

const OP_NAMES = [
  "set", "insert_item", "remove_item", "insert_block", "move_block", "remove_block", "add_page", "archive_page", "restore_page",
  "add_item", "set_item_status", "set_brand_color", "set_font",
];
const TARGETS = ["page", "item", "settings"];
const OP_KEYS: Record<string, string[]> = {
  set: ["op", "pointer", "value"],
  insert_item: ["op", "pointer", "at", "value"],
  remove_item: ["op", "pointer", "at"],
  add_item: ["op", "collection", "slug", "item"],
  set_item_status: ["op", "item", "status"],
  set_brand_color: ["op", "role", "value"],
  set_font: ["op", "role", "font"],
  insert_block: ["op", "page", "at", "block"],
  move_block: ["op", "page", "from", "to"],
  remove_block: ["op", "page", "block"],
  add_page: ["op", "page"],
  archive_page: ["op", "page"],
  restore_page: ["op", "page"],
};
const BLOCK_KEYS = ["type", "variant", "anchor", "content"];
const UNSAFE_KEYS = ["__proto__", "constructor", "prototype"];

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
  }
  return false;
}

class Problem extends Error {}
const refuse = (message: string): never => {
  throw new Problem(message);
};

function parsePointer(pointer: unknown): string[] {
  if (typeof pointer !== "string" || !pointer.startsWith("/") || /~(?![01])/.test(pointer)) {
    return refuse(`"${String(pointer)}" is not a valid pointer; it must start with "/".`);
  }
  return pointer
    .slice(1)
    .split("/")
    .map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~"));
}

const isIndex = (token: string) => /^(0|[1-9]\d*)$/.test(token);

/** Refuses pointers that reach anything but a page's title, description, menu or a block's content, variant or anchor. */
function checkAllowed(tokens: string[], page: Json, pointer: string): void {
  const first = tokens[0];
  if (first === "path") refuse("a page's path cannot be changed.");
  if (first === "status") refuse("a page's status cannot be set; use archive_page or restore_page.");
  if ((first === "title" || first === "description") && tokens.length === 1) return;
  if (first === "menu") return;
  if (first === "blocks") {
    if (tokens.length === 1) refuse("the list of blocks cannot be set; use insert_block, move_block or remove_block.");
    const blocks = page.blocks as unknown[];
    if (!isIndex(tokens[1]) || Number(tokens[1]) >= blocks.length) {
      refuse(`${pointer} names a block that does not exist (the page has ${blocks.length}; indexes run from 0 to ${blocks.length - 1}).`);
    }
    if (tokens.length === 2) refuse("name what to change inside the block: content, variant or anchor.");
    if (tokens[2] === "type") refuse("a block's type cannot be changed; remove the block and insert a new one.");
    if (tokens[2] === "content" || ((tokens[2] === "variant" || tokens[2] === "anchor") && tokens.length === 3)) return;
  }
  refuse(`${pointer} is not allowed; a pointer must start with /title, /description, /menu, /blocks/<index>/content, /blocks/<index>/variant or /blocks/<index>/anchor.`);
}

function walk(root: unknown, tokens: string[], pointer: string): unknown {
  let node = root;
  for (const token of tokens) {
    if (Array.isArray(node) && isIndex(token) && Number(token) < node.length) node = node[Number(token)];
    else if (isObject(node) && Object.hasOwn(node, token)) node = node[token];
    else return refuse(`${pointer} goes through something that does not exist ("${token}").`);
  }
  return node;
}

function checkAt(at: unknown, max: number, what: string): number {
  if (!Number.isInteger(at) || (at as number) < 1 || (at as number) > max) {
    return refuse(`${what} must be a whole number from 1 to ${max}, not ${JSON.stringify(at)}.`);
  }
  return at as number;
}

/** The document key of an item: "<collection>/<slug>". */
const itemKey = (kind: string, slug: string): string => `${kind}/${slug}`;

export function applyOperations(pages: ReadonlyMap<string, unknown>, ops: unknown, docs: Documents = { items: new Map(), settings: new Map() }): ApplyResult {
  if (!Array.isArray(ops)) return { ok: false, problems: ["The operations must be a list."] };
  if (ops.length > MAX_OPERATIONS) {
    return { ok: false, problems: [`Too many operations: ${ops.length}. One proposal may hold at most ${MAX_OPERATIONS}.`] };
  }
  const named = new Set<string>();
  const namedItems = new Set<string>();
  for (const raw of ops) {
    if (!isObject(raw)) continue;
    const page = raw.op === "add_page" && isObject(raw.page) ? raw.page.path : raw.page;
    if (typeof page === "string") named.add(page);
    if (typeof raw.item === "string") namedItems.add(raw.item);
    if (raw.op === "add_item" && typeof raw.collection === "string" && typeof raw.slug === "string") namedItems.add(itemKey(raw.collection, raw.slug));
  }
  if (named.size > MAX_PAGES) {
    return { ok: false, problems: [`Too many pages: ${named.size}. One proposal may touch at most ${MAX_PAGES}.`] };
  }
  if (namedItems.size > MAX_ITEMS) {
    return { ok: false, problems: [`Too many items: ${namedItems.size}. One proposal may touch at most ${MAX_ITEMS}.`] };
  }

  const work = new Map<string, Json>();
  const ids = new Map<string, (string | null)[]>();
  const before = new Map<string, string[]>();
  for (const [path, value] of pages) {
    const copy = structuredClone(value);
    if (!isObject(copy)) continue;
    work.set(path, copy);
    if (Array.isArray(copy.blocks)) {
      const list = copy.blocks.map((_, i) => `${path}#${i + 1}`);
      before.set(path, list);
      ids.set(path, [...list]);
    }
  }
  const cloneAll = (source: ReadonlyMap<string, unknown>): Map<string, Json> => {
    const out = new Map<string, Json>();
    for (const [key, value] of source) {
      const copy = structuredClone(value);
      if (isObject(copy)) out.set(key, copy);
    }
    return out;
  };
  const items = cloneAll(docs.items);
  const settings = cloneAll(docs.settings);
  const scope: Scope = { pages: work, items, settings, originalPages: pages, originalItems: docs.items };

  const moved: string[] = [];
  for (const [index, raw] of ops.entries()) {
    const name = isObject(raw) && typeof raw.op === "string" ? raw.op : "unknown";
    try {
      applyOne(raw, scope, ids, moved);
    } catch (error) {
      if (!(error instanceof Problem)) throw error;
      return { ok: false, problems: [`Operation ${index + 1} (${name}): ${error.message}`] };
    }
  }

  const changed = (original: ReadonlyMap<string, unknown>, now: ReadonlyMap<string, unknown>) =>
    [...now.keys()].filter((key) => !original.has(key) || !deepEqual(original.get(key), now.get(key)));
  const touched = changed(pages, work);
  const after = new Map<string, unknown>(work);
  const afterIds = new Map<string, (string | null)[]>();
  for (const [path, page] of work) afterIds.set(path, ids.get(path) ?? (Array.isArray(page.blocks) ? page.blocks.map(() => null) : []));
  return {
    ok: true,
    after,
    touched,
    moved,
    ids: { before, after: afterIds },
    items: new Map<string, unknown>(items),
    settings: new Map<string, unknown>(settings),
    touchedItems: changed(docs.items, items),
    touchedSettings: changed(docs.settings, settings),
  };
}

/** The documents the operations work on. */
interface Scope {
  pages: Map<string, Json>;
  items: Map<string, Json>;
  settings: Map<string, Json>;
  originalPages: ReadonlyMap<string, unknown>;
  originalItems: ReadonlyMap<string, unknown>;
}

function applyOne(raw: unknown, scope: Scope, ids: Map<string, (string | null)[]>, moved: string[]): void {
  const { pages: work, originalPages: original } = scope;
  if (!isObject(raw)) return refuse("an operation must be an object with an op field.");
  const op = raw.op;
  if (typeof op !== "string" || !OP_NAMES.includes(op)) {
    return refuse(`unknown operation; use one of ${OP_NAMES.join(", ")}.`);
  }
  const pointerOp = op === "set" || op === "insert_item" || op === "remove_item";
  const allowed = pointerOp ? [...OP_KEYS[op], ...TARGETS] : (OP_KEYS[op] ?? ["op", "page"]);
  for (const key of Object.keys(raw)) if (!allowed.includes(key)) refuse(`"${key}" is not a field of ${op}.`);
  for (const key of OP_KEYS[op] ?? ["op", "page"]) if (!(key in raw)) refuse(`the field "${key}" is missing.`);
  if (pointerOp) {
    const named = TARGETS.filter((key) => key in raw);
    if (named.length !== 1) refuse('name what to change with exactly one of "page", "item" or "settings".');
    if (!("page" in raw)) return applyDocumentPointerOp(op, raw, scope, named[0] as "item" | "settings");
  }
  if (op === "add_item" || op === "set_item_status") return applyItemOp(op, raw, scope);
  if (op === "set_brand_color" || op === "set_font") {
    if (BRAND_FIXED) return refuse(BRAND_FIXED_MESSAGE);
    return applyBrandOp(op, raw, scope.settings);
  }

  if (op === "add_page") {
    const page = raw.page;
    if (!isObject(page) || typeof page.path !== "string" || !page.path.startsWith("/")) {
      return refuse('the page must be an object whose "path" starts with "/".');
    }
    if (work.has(page.path) || original.has(page.path)) {
      return refuse(`${page.path} already exists; use restore_page for an archived page or set to change it.`);
    }
    const copy = structuredClone(page);
    work.set(page.path, copy);
    ids.set(page.path, Array.isArray(copy.blocks) ? copy.blocks.map(() => null) : []);
    return;
  }

  const path = raw.page;
  if (typeof path !== "string") return refuse("the page must be a path such as /services.");
  const page = work.get(path);
  if (!page) return refuse(`there is no page ${path}.`);

  if (op === "archive_page" || op === "restore_page") {
    const target = op === "archive_page" ? "archived" : "live";
    if (page.status === target) return refuse(`${path} is already ${target}.`);
    page.status = target;
    return;
  }

  if (op === "set" || op === "insert_item" || op === "remove_item") return applyPointerOp(op, raw, page, pageGuard(page));

  if (!Array.isArray(page.blocks)) return refuse(`${path} has no list of blocks.`);
  const blocks = page.blocks as unknown[];
  const blockIds = ids.get(path) ?? [];
  if (op === "insert_block") {
    const at = checkAt(raw.at, blocks.length + 1, "at");
    const block = raw.block;
    if (!isObject(block)) return refuse("the block must be an object with type and content.");
    for (const key of Object.keys(block)) if (!BLOCK_KEYS.includes(key)) refuse(`"${key}" is not a field of a block; use type, variant, anchor and content.`);
    if (typeof block.type !== "string" || !isObject(block.content)) return refuse("the block needs a type (text) and a content (object).");
    blocks.splice(at - 1, 0, structuredClone(block));
    blockIds.splice(at - 1, 0, null);
  } else if (op === "remove_block") {
    const n = checkAt(raw.block, blocks.length, "block");
    blocks.splice(n - 1, 1);
    blockIds.splice(n - 1, 1);
  } else {
    const from = checkAt(raw.from, blocks.length, "from");
    const to = checkAt(raw.to, blocks.length, "to");
    const [block] = blocks.splice(from - 1, 1);
    blocks.splice(to - 1, 0, block);
    const [id] = blockIds.splice(from - 1, 1);
    if (id !== null && !moved.includes(id)) moved.push(id);
    blockIds.splice(to - 1, 0, id);
  }
  ids.set(path, blockIds);
}

/** What a pointer may reach in a document; refuses with a plain reason. */
type Guard = (tokens: string[], pointer: string) => void;

function applyPointerOp(op: string, raw: Json, root: Json, guard: Guard, keepsNull: (parent: Json, key: string) => boolean = () => false): void {
  const tokens = parsePointer(raw.pointer);
  const pointer = String(raw.pointer);
  guard(tokens, pointer);

  if (op === "insert_item" || op === "remove_item") {
    const list = walk(root, tokens, pointer);
    if (!Array.isArray(list)) return refuse(`${pointer} is not a list.`);
    if (op === "insert_item") list.splice(checkAt(raw.at, list.length + 1, "at") - 1, 0, structuredClone(raw.value));
    else list.splice(checkAt(raw.at, list.length, "at") - 1, 1);
    return;
  }

  const parent = walk(root, tokens.slice(0, -1), pointer);
  const last = tokens[tokens.length - 1];
  const value = structuredClone(raw.value);
  if (Array.isArray(parent)) {
    if (!isIndex(last) || Number(last) >= parent.length) return refuse(`${pointer} names a list position that does not exist; use insert_item to add one.`);
    if (value === null) return refuse("a list entry cannot be set to null; use remove_item.");
    parent[Number(last)] = value;
  } else if (isObject(parent)) {
    if (UNSAFE_KEYS.includes(last)) return refuse(`"${last}" is not allowed as a key.`);
    if (value === null && !keepsNull(parent, last)) delete parent[last];
    else parent[last] = value;
  } else {
    refuse(`${pointer} goes through something that holds no fields.`);
  }
}

const pageGuard = (page: Json): Guard => (tokens, pointer) => checkAllowed(tokens, page, pointer);

/** Settings fields whose "nothing" is a null value, not a missing field. */
const NULLABLE_SETTINGS = ["logo", "endsOn", "hours"];

function applyDocumentPointerOp(op: string, raw: Json, scope: Scope, target: "item" | "settings"): void {
  const name = raw[target];
  if (target === "item") {
    if (typeof name !== "string" || !scope.items.has(name)) {
      return refuse(`there is no item ${JSON.stringify(name)}; name it as "posts/<slug>". Use add_item for a new one.`);
    }
    const item = scope.items.get(name) as Json;
    const guard: Guard = (tokens, pointer) => {
      if (tokens[0] === "status") refuse("an item's status cannot be set; use set_item_status.");
      if (tokens[0] === "") refuse(`${pointer} is not allowed; name a field of the item, such as /title.`);
    };
    return applyPointerOp(op, raw, item, guard);
  }
  // Brand is fixed on this site (docs/SITE-DIFFERENCES.md, D11): the colors, the fonts and the logo are not the owner's to change.
  if (BRAND_FIXED && name === "brand") return refuse(BRAND_FIXED_MESSAGE);
  if (typeof name !== "string" || !(SETTINGS_NAMES as readonly string[]).includes(name) || !scope.settings.has(name)) {
    return refuse(`there are no settings called ${JSON.stringify(name)}; use one of ${SETTINGS_NAMES.join(", ")}.`);
  }
  const doc = scope.settings.get(name) as Json;
  const guard: Guard = (tokens, pointer) => {
    if (name === "brand" && tokens[0] !== "logo") {
      refuse(`${pointer} is not allowed in the brand settings; only /logo is set this way. Colors go through set_brand_color and fonts through set_font.`);
    }
    if (tokens[0] === "") refuse(`${pointer} is not allowed; name a setting, such as /phone.`);
  };
  applyPointerOp(op, raw, doc, guard, (parent, key) => parent === doc && (NULLABLE_SETTINGS.includes(key) || parent[key] === null));
}

function applyItemOp(op: string, raw: Json, scope: Scope): void {
  if (op === "add_item") {
    const { collection, slug, item } = raw;
    if (typeof collection !== "string" || !(COLLECTION_KINDS as readonly string[]).includes(collection)) {
      return refuse(`"${String(collection)}" is not a collection; use one of ${COLLECTION_KINDS.join(", ")}.`);
    }
    if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
      return refuse(`the slug ${JSON.stringify(slug)} must be lowercase words and digits joined by hyphens, 1 to 60 characters, like "new-inspection-service".`);
    }
    if (collection === "posts" && (RESERVED_POST_SLUGS as readonly string[]).includes(slug)) {
      return refuse(`the slug "${slug}" is used by the blog's own pages; choose another.`);
    }
    const key = itemKey(collection, slug);
    const existing = scope.items.get(key) ?? scope.originalItems.get(key);
    if (existing !== undefined) {
      const status = isObject(existing) ? existing.status : undefined;
      return refuse(
        status === "archived"
          ? `${key} exists, archived; restore it instead (set_item_status to "live" or "draft").`
          : `${key} already exists; use set to change it, or pick another slug.`,
      );
    }
    if (!isObject(item)) return refuse("the item must be an object holding the item's status and fields.");
    if (item.status !== "draft" && item.status !== "live") {
      return refuse('a new item needs "status": "draft" or "live" (a new item is never archived). Save it as a draft unless the owner said to publish it.');
    }
    scope.items.set(key, structuredClone(item));
    return;
  }
  const { item: key, status } = raw;
  const current = typeof key === "string" ? scope.items.get(key) : undefined;
  if (typeof key !== "string" || current === undefined) return refuse(`there is no item ${JSON.stringify(key)}; name it as "posts/<slug>".`);
  if (typeof status !== "string" || !(ITEM_STATUSES as readonly string[]).includes(status)) {
    return refuse(`the status must be one of ${ITEM_STATUSES.join(", ")}.`);
  }
  if (current.status === status) return refuse(`${key} is already ${status}.`);
  current.status = status;
}

const floorOne = (n: number) => (Math.floor(n * 10) / 10).toFixed(1);

function applyBrandOp(op: string, raw: Json, settings: Map<string, Json>): void {
  const brand = settings.get("brand");
  if (!brand || !isObject(brand.colors) || !isObject(brand.fonts)) return refuse("the brand settings could not be read, so the brand cannot be changed.");
  if (op === "set_font") {
    const { role, font } = raw;
    if (typeof role !== "string" || !(FONT_ROLES as readonly string[]).includes(role)) {
      return refuse(`the font role must be one of ${FONT_ROLES.join(", ")}.`);
    }
    const options = CURATED_FONTS[role as keyof typeof CURATED_FONTS];
    if (typeof font !== "string" || !options.some((entry) => entry.id === font)) {
      return refuse(`${JSON.stringify(font)} is not a ${role} font this site offers. Choose one of: ${options.map((entry) => entry.id).join(", ")}.`);
    }
    brand.fonts = { ...brand.fonts, [role]: font };
    return;
  }
  const { role, value } = raw;
  if (role !== "brand" && role !== "accent") return refuse('the color role must be "brand" or "accent".');
  if (typeof value !== "string" || parseHex(value) === null) return refuse(`${JSON.stringify(value)} is not a color; write it as #rrggbb, like #1e4fa3.`);
  const current = brand.colors as unknown as Palette;
  const failures = roleFailures(current, role, value);
  if (failures.length > 0) {
    const label = role === "brand" ? "brand color" : "accent color";
    const near = nearestPassing(current, role, value);
    const lines = failures.slice(0, 3).map((pair) => `${pair.where}: it reaches ${floorOne(pair.ratio)} to 1 and needs ${pair.min} to 1`);
    const fix = near === null ? `No shade of that color works with this site's design; ${AGENCY_NAME} can help.` : `Try ${near}, the nearest shade that keeps every pair readable.`;
    return refuse(`the ${label} ${value.toLowerCase()} is not strong enough. For ${lines.join("; and for ")}. ${fix}`);
  }
  brand.colors = role === "brand" ? deriveFromBrand(current, value) : { ...current, rust: value.toLowerCase() };
}
