// Builds the plain-text change list the owner reads before saying yes, from the real before and after page values (not
// from the operations). Every value is printed with JSON.stringify, so text is always quoted plain text.
import type { AnyBlockDefinition, Field } from "../../src/blocks/schema.ts";
import { isObject, type Json } from "./json.ts";
import { deepEqual, type BlockIds } from "./operations.ts";

type Entry = { path: string[]; lines: string[] };

const quote = (value: unknown) => JSON.stringify(value);
const text = (label: string): Field => ({ kind: "text", label, max: 0 });

const PLACE_NAMES: Record<string, string> = { header: "header menu", footer: "footer menu", legal: "legal menu" };
const SUBKEY_LABELS: Record<string, string> = { label: "Label", href: "Link", src: "File", alt: "Alt text" };

// The page-level fields a person can see, written as a field schema so they take the same code path as block fields.
const PAGE_FIELDS: Field = {
  kind: "object",
  label: "",
  fields: {
    title: text("Title"),
    description: text("Description"),
    menu: {
      kind: "object",
      label: "Menu",
      fields: {
        label: text("Label"),
        order: text("Order"),
        places: { kind: "list", label: "Places", min: 0, max: 3, of: text("Place") },
      },
    },
  },
};

function childField(def: Field | undefined, key: string): Field | undefined {
  return def?.kind === "object" ? def.fields[key] : undefined;
}

function keyLabel(def: Field | undefined, key: string): string {
  const child = childField(def, key);
  if (child) return child.label;
  return (def?.kind === "action" || def?.kind === "image") && SUBKEY_LABELS[key] ? SUBKEY_LABELS[key] : key;
}

function entryField(def: Field | undefined): Field | undefined {
  return def?.kind === "list" ? def.of : undefined;
}

/** Every text leaf of a value, as `Label, entry 2, Label: "text"` lines (a bare value when it has no label path). */
function leaves(value: unknown, def: Field | undefined, path: string[], out: string[]): string[] {
  if (Array.isArray(value)) {
    value.forEach((item, i) => leaves(item, entryField(def), [...path, `entry ${i + 1}`], out));
  } else if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) leaves(item, childField(def, key), [...path, keyLabel(def, key)], out);
  } else {
    out.push(path.length ? `${path.join(", ")}: ${quote(value)}` : quote(value));
  }
  return out;
}

function verbLines(verb: string, value: unknown, def: Field | undefined): string[] {
  if (!Array.isArray(value) && !isObject(value)) return [`${verb}: ${quote(value)}`];
  return [`${verb}:`, ...leaves(value, def, [], []).map((line) => `  ${line}`)];
}

function diffValue(before: unknown, after: unknown, def: Field | undefined, path: string[], out: Entry[]): void {
  if (deepEqual(before, after)) return;
  const container = (value: unknown) => Array.isArray(value) || isObject(value);
  if (!container(before) && !container(after)) {
    const show = (value: unknown) => (value === undefined ? "(nothing)" : quote(value));
    out.push({ path, lines: [`was: ${show(before)}`, `now: ${show(after)}`] });
  } else if (Array.isArray(before) && Array.isArray(after)) {
    diffList(before, after, entryField(def), path, out);
  } else if (isObject(before) && isObject(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      diffValue(before[key], after[key], childField(def, key), [...path, keyLabel(def, key)], out);
    }
  } else {
    if (before !== undefined) out.push({ path, lines: verbLines("removes", before, def) });
    if (after !== undefined) out.push({ path, lines: verbLines("adds", after, def) });
  }
}

function diffList(before: unknown[], after: unknown[], of: Field | undefined, path: string[], out: Entry[]): void {
  let start = 0;
  while (start < before.length && start < after.length && deepEqual(before[start], after[start])) start += 1;
  let end = 0;
  while (end < before.length - start && end < after.length - start && deepEqual(before[before.length - 1 - end], after[after.length - 1 - end])) end += 1;
  const removed = before.slice(start, before.length - end);
  const added = after.slice(start, after.length - end);
  if (removed.length === added.length) {
    removed.forEach((item, i) => diffValue(item, added[i], of, [...path, `entry ${start + i + 1}`], out));
    return;
  }
  removed.forEach((item, i) => out.push({ path: [...path, `entry ${start + i + 1}`], lines: verbLines("removes", item, of) }));
  added.forEach((item, i) => out.push({ path: [...path, `entry ${start + i + 1}`], lines: verbLines("adds", item, of) }));
}

const render = (entries: Entry[]) => entries.flatMap(({ path, lines }) => [`  ${path.join(", ")}:`, ...lines.map((line) => `    ${line}`)]);

function blockFieldLines(block: Json, def: AnyBlockDefinition | undefined): string[] {
  const root: Field | undefined = def ? { kind: "object", label: "", fields: def.fields } : undefined;
  const lines = leaves(block.content, root, [], []);
  if (typeof block.variant === "string") lines.push(`Style: ${quote(block.variant)}`);
  if (typeof block.anchor === "string") lines.push(`Anchor: ${quote(block.anchor)}`);
  return lines;
}

/** The longest run of blocks that kept their relative order; the rest are the blocks that moved. */
function stationary(order: number[]): Set<number> {
  const best: number[][] = [];
  order.forEach((value, i) => {
    let seq: number[] = [value];
    for (let j = 0; j < i; j++) {
      if (order[j] < value && best[j].length + 1 >= seq.length) seq = [...best[j], value];
    }
    best.push(seq);
  });
  return new Set(best.reduce((a, b) => (b.length > a.length ? b : a), []));
}

function menuPlaces(menu: unknown): string[] {
  if (!isObject(menu) || !Array.isArray(menu.places)) return [];
  return menu.places.filter((p): p is string => typeof p === "string");
}

function menuPhrases(menu: unknown): string[] {
  if (!isObject(menu) || typeof menu.label !== "string") return [];
  return menuPlaces(menu).map((place) => `in the ${PLACE_NAMES[place] ?? place} as ${quote(menu.label)}`);
}

function listAnd(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function buildChangeList(
  before: ReadonlyMap<string, unknown>,
  after: ReadonlyMap<string, unknown>,
  ids: BlockIds,
  registry: readonly AnyBlockDefinition[],
  moved: readonly string[] = [],
): string {
  const definition = (block: unknown) => registry.find((d) => d.type === (isObject(block) ? block.type : undefined));
  const title = (block: unknown) => definition(block)?.title ?? (isObject(block) ? String(block.type) : "unknown");
  const sections: string[] = [];

  for (const [path, page] of after) {
    const old = before.get(path);
    if (deepEqual(old, page) || !isObject(page)) continue;
    const blocks = Array.isArray(page.blocks) ? page.blocks : [];
    const lines: string[] = [];

    if (!isObject(old)) {
      const phrases = menuPhrases(page.menu);
      lines.push(`New page ${path} (${quote(page.title)})${phrases.map((p) => `, ${p}`).join("")}`);
      if (typeof page.description === "string") lines.push(`  Description: ${quote(page.description)}`);
      blocks.forEach((block, i) => {
        lines.push(`  Block ${i + 1} (${title(block)}):`, ...blockFieldLines(block as Json, definition(block)).map((l) => `    ${l}`));
      });
      sections.push(lines.join("\n"));
      continue;
    }

    lines.push(`Page ${path} (${quote(page.title)}):`);
    if (old.status !== page.status) {
      if (page.status === "archived") {
        const where = ["the site", ...menuPlaces(old.menu).map((p) => `the ${PLACE_NAMES[p] ?? p}`)];
        lines.push(`  Archives ${path}: it leaves ${listAnd(where)}. Nothing is deleted; it can be brought back.`);
      } else {
        const phrases = menuPhrases(old.menu);
        lines.push(`  Brings back ${path}${phrases.map((p) => `, ${p}`).join("")}.`);
      }
    }
    const pageEntries: Entry[] = [];
    diffValue({ title: old.title, description: old.description, menu: old.menu }, { title: page.title, description: page.description, menu: page.menu }, PAGE_FIELDS, [], pageEntries);
    lines.push(...render(pageEntries));

    const oldBlocks = Array.isArray(old.blocks) ? old.blocks : [];
    const oldIds = ids.before.get(path) ?? [];
    const newIds = ids.after.get(path) ?? [];
    const keptIds = new Set(newIds.filter((id): id is string => id !== null));

    oldBlocks.forEach((block, i) => {
      if (keptIds.has(oldIds[i])) return;
      lines.push(`  Removes block ${i + 1} (${title(block)}), which said:`, ...blockFieldLines(block as Json, definition(block)).map((l) => `    ${l}`));
    });

    const survivors = newIds.map((id, i) => ({ id, at: i + 1 })).filter((s): s is { id: string; at: number } => s.id !== null);
    const oldPos = (id: string) => oldIds.indexOf(id) + 1;
    const hinted = new Set(moved);
    const rest = survivors.filter((s) => !hinted.has(s.id)).map((s) => oldPos(s.id));
    const hintFits = moved.length > 0 && rest.every((pos, i) => i === 0 || rest[i - 1] < pos);
    const still = hintFits ? new Set(rest) : stationary(survivors.map((s) => oldPos(s.id)));
    for (const s of survivors) {
      if (!still.has(oldPos(s.id))) lines.push(`  Block "${title(oldBlocks[oldPos(s.id) - 1])}" moves from block ${oldPos(s.id)} to block ${s.at}.`);
    }

    newIds.forEach((id, i) => {
      if (id !== null) return;
      lines.push(`  Adds block ${i + 1} (${title(blocks[i])}):`, ...blockFieldLines(blocks[i] as Json, definition(blocks[i])).map((l) => `    ${l}`));
    });

    for (const s of survivors) {
      const was = oldBlocks[oldPos(s.id) - 1];
      const now = blocks[s.at - 1];
      if (!isObject(was) || !isObject(now)) continue;
      const prefix = `Block ${s.at} (${title(now)})`;
      const def = definition(now);
      const entries: Entry[] = [];
      diffValue(was.content, now.content, def ? { kind: "object", label: "", fields: def.fields } : undefined, [prefix], entries);
      diffValue(was.variant, now.variant, text("Style"), [prefix, "Style"], entries);
      diffValue(was.anchor, now.anchor, text("Anchor"), [prefix, "Anchor"], entries);
      lines.push(...render(entries));
    }
    sections.push(lines.join("\n"));
  }
  return sections.join("\n\n");
}

function placeholderCounts(page: unknown): Map<string, number> {
  const counts = new Map<string, number>();
  const visit = (value: unknown) => {
    if (typeof value === "string") for (const [found] of value.matchAll(/\[\[[^\]]+\]\]/g)) counts.set(found, (counts.get(found) ?? 0) + 1);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (isObject(value)) Object.values(value).forEach(visit);
  };
  visit(page);
  return counts;
}

export function addedPlaceholders(before: ReadonlyMap<string, unknown>, after: ReadonlyMap<string, unknown>): string[] {
  const problems: string[] = [];
  for (const [path, page] of after) {
    const old = before.get(path);
    if (deepEqual(old, page)) continue;
    const was = placeholderCounts(old);
    for (const [found, count] of placeholderCounts(page)) {
      if (count > (was.get(found) ?? 0)) problems.push(`Page ${path}: adds the placeholder "${found}"; write the real text instead.`);
    }
  }
  return problems;
}

/**
 * Block ids for a restore, where no operations say which block is which: an after block equal to an unused before block
 * takes its id (the same position first); then a remaining after block at the same position with the same type takes that
 * before block's id; the rest are new (null). A page that is not in `before` is all new.
 */
export function matchBlockIds(before: ReadonlyMap<string, unknown>, after: ReadonlyMap<string, unknown>): BlockIds {
  const blocksOf = (page: unknown): unknown[] => (isObject(page) && Array.isArray(page.blocks) ? page.blocks : []);
  const ids: BlockIds = { before: new Map(), after: new Map() };
  for (const [path, page] of before) ids.before.set(path, blocksOf(page).map((_, i) => `${path}#${i + 1}`));
  for (const [path, page] of after) {
    const old = blocksOf(before.get(path));
    const now = blocksOf(page);
    const taken = new Set<number>();
    const matched: (number | null)[] = now.map(() => null);
    now.forEach((block, i) => {
      const at = [i, ...old.keys()].find((j) => j < old.length && !taken.has(j) && deepEqual(old[j], block));
      if (at !== undefined) {
        taken.add(at);
        matched[i] = at;
      }
    });
    now.forEach((block, i) => {
      const sameType = i < old.length && !taken.has(i) && isObject(old[i]) && isObject(block) && old[i].type === block.type;
      if (matched[i] === null && sameType) {
        taken.add(i);
        matched[i] = i;
      }
    });
    ids.after.set(path, matched.map((j) => (j === null ? null : `${path}#${j + 1}`)));
  }
  return ids;
}
