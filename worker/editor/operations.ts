// Applies a proposal's operations to the page files, in memory. Pure: no I/O, and the input is never changed.
// The editor service validates the result with the build's validator; this file only refuses what an operation itself
// may not do. Block numbers and list positions are 1-based (as the owner sees them); pointers are RFC 6901 (0-based).

import { isObject, type Json } from "./json.ts";

export const MAX_OPERATIONS = 40;
export const MAX_PAGES = 5;

/** Per page path, the id of each block in order. Before ids are "<path>#<n>"; after, a surviving block keeps its id and an inserted one is null. */
export type BlockIds = { before: Map<string, string[]>; after: Map<string, (string | null)[]> };

type Block = { type: string; variant?: string; anchor?: string; content: unknown };

export type Operation =
  | { op: "set"; page: string; pointer: string; value: unknown }
  | { op: "insert_item"; page: string; pointer: string; at: number; value: unknown }
  | { op: "remove_item"; page: string; pointer: string; at: number }
  | { op: "insert_block"; page: string; at: number; block: Block }
  | { op: "move_block"; page: string; from: number; to: number }
  | { op: "remove_block"; page: string; block: number }
  | { op: "add_page"; page: Record<string, unknown> }
  | { op: "archive_page"; page: string }
  | { op: "restore_page"; page: string };

export type ApplyResult =
  | { ok: true; after: Map<string, unknown>; touched: string[]; moved: string[]; ids: BlockIds }
  | { ok: false; problems: string[] };

const OP_NAMES = ["set", "insert_item", "remove_item", "insert_block", "move_block", "remove_block", "add_page", "archive_page", "restore_page"];
const OP_KEYS: Record<string, string[]> = {
  set: ["op", "page", "pointer", "value"],
  insert_item: ["op", "page", "pointer", "at", "value"],
  remove_item: ["op", "page", "pointer", "at"],
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

export function applyOperations(pages: ReadonlyMap<string, unknown>, ops: unknown): ApplyResult {
  if (!Array.isArray(ops)) return { ok: false, problems: ["The operations must be a list."] };
  if (ops.length > MAX_OPERATIONS) {
    return { ok: false, problems: [`Too many operations: ${ops.length}. One proposal may hold at most ${MAX_OPERATIONS}.`] };
  }
  const named = new Set<string>();
  for (const raw of ops) {
    if (!isObject(raw)) continue;
    const page = raw.op === "add_page" && isObject(raw.page) ? raw.page.path : raw.page;
    if (typeof page === "string") named.add(page);
  }
  if (named.size > MAX_PAGES) {
    return { ok: false, problems: [`Too many pages: ${named.size}. One proposal may touch at most ${MAX_PAGES}.`] };
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

  const moved: string[] = [];
  for (const [index, raw] of ops.entries()) {
    const name = isObject(raw) && typeof raw.op === "string" ? raw.op : "unknown";
    try {
      applyOne(raw, work, ids, pages, moved);
    } catch (error) {
      if (!(error instanceof Problem)) throw error;
      return { ok: false, problems: [`Operation ${index + 1} (${name}): ${error.message}`] };
    }
  }

  const touched = [...work.keys()].filter((path) => !pages.has(path) || !deepEqual(pages.get(path), work.get(path)));
  const after = new Map<string, unknown>(work);
  const afterIds = new Map<string, (string | null)[]>();
  for (const [path, page] of work) afterIds.set(path, ids.get(path) ?? (Array.isArray(page.blocks) ? page.blocks.map(() => null) : []));
  return { ok: true, after, touched, moved, ids: { before, after: afterIds } };
}

function applyOne(raw: unknown, work: Map<string, Json>, ids: Map<string, (string | null)[]>, original: ReadonlyMap<string, unknown>, moved: string[]): void {
  if (!isObject(raw)) return refuse("an operation must be an object with an op field.");
  const op = raw.op;
  if (typeof op !== "string" || !OP_NAMES.includes(op)) {
    return refuse(`unknown operation; use one of ${OP_NAMES.join(", ")}.`);
  }
  const allowed = OP_KEYS[op];
  for (const key of Object.keys(raw)) if (!allowed.includes(key)) refuse(`"${key}" is not a field of ${op}.`);
  for (const key of allowed) if (!(key in raw)) refuse(`the field "${key}" is missing.`);

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

  if (op === "set" || op === "insert_item" || op === "remove_item") return applyPointerOp(op, raw, page);

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

function applyPointerOp(op: string, raw: Json, page: Json): void {
  const tokens = parsePointer(raw.pointer);
  const pointer = String(raw.pointer);
  checkAllowed(tokens, page, pointer);

  if (op === "insert_item" || op === "remove_item") {
    const list = walk(page, tokens, pointer);
    if (!Array.isArray(list)) return refuse(`${pointer} is not a list.`);
    if (op === "insert_item") list.splice(checkAt(raw.at, list.length + 1, "at") - 1, 0, structuredClone(raw.value));
    else list.splice(checkAt(raw.at, list.length, "at") - 1, 1);
    return;
  }

  const parent = walk(page, tokens.slice(0, -1), pointer);
  const last = tokens[tokens.length - 1];
  const value = structuredClone(raw.value);
  if (Array.isArray(parent)) {
    if (!isIndex(last) || Number(last) >= parent.length) return refuse(`${pointer} names a list position that does not exist; use insert_item to add one.`);
    if (value === null) return refuse("a list entry cannot be set to null; use remove_item.");
    parent[Number(last)] = value;
  } else if (isObject(parent)) {
    if (UNSAFE_KEYS.includes(last)) return refuse(`"${last}" is not allowed as a key.`);
    if (value === null) delete parent[last];
    else parent[last] = value;
  } else {
    refuse(`${pointer} goes through something that holds no fields.`);
  }
}
