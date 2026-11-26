// The change list's sections for collection items and the three settings files. Like change-list.ts, it is built from the
// real before and after values (never from the operations), prints every value as quoted plain text, and never cuts an
// item short: the owner reads every field and every body part.
import type { AnyBlockDefinition, Field } from "../../src/blocks/schema.ts";
import { CONTRAST_PAIRS, type ColorToken } from "../../src/brand/contrast-pairs.ts";
import { CURATED_FONTS, FONT_ROLES, type FontRole } from "../../src/brand/fonts.ts";
import { SETTINGS_NAMES } from "../../src/settings/names.ts";
import { BUSINESS_LABELS } from "../../src/settings/business.ts";
import { NOTICE_LABELS } from "../../src/settings/notice.ts";
import { collectionFor } from "../../src/collections/definitions.ts";
import type { CollectionDefinition } from "../../src/collections/schema.ts";
import { type Ctx, type Entry, diffValue, leaves, photoText, quote, render, text } from "./change-list.ts";
import { isObject } from "./json.ts";
import { deepEqual } from "./operations.ts";

export interface DocumentChange {
  before: { items: ReadonlyMap<string, unknown>; settings: ReadonlyMap<string, unknown> };
  after: { items: ReadonlyMap<string, unknown>; settings: ReadonlyMap<string, unknown> };
  touchedItems: readonly string[];
  touchedSettings: readonly string[];
  /** The pages this change adds or changes. */
  touchedPages: readonly string[];
  /** The pages as they would be after the change, to say when a list section would show nothing. */
  pages: ReadonlyMap<string, unknown>;
  /** Today's date, YYYY-MM-DD, in the site's time zone. */
  today: string;
}

/** A post longer than this ends its change list entry with the preview line. */
export const LONG_POST = 1500;
export const LONG_POST_LINE = "This post is long: offer the owner the preview link.";

/** The block types that show a kind's items, from each definition's `collection`; a kind with none live leaves these sections empty. */
function listBlocks(registry: readonly AnyBlockDefinition[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const definition of registry) {
    if (definition.collection !== undefined) out.set(definition.collection, [...(out.get(definition.collection) ?? []), definition.type]);
  }
  return out;
}

const status = (item: unknown): string => (isObject(item) && typeof item.status === "string" ? item.status : "");

// ---- items ----

type Part = Record<string, unknown>;
const parts = (body: unknown): Part[] => (Array.isArray(body) ? body.filter(isObject) : []);

function inlineText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((piece) => (isObject(piece) ? `[${String(piece.text)}](${String(piece.href)})` : String(piece))).join("");
}

function partTexts(part: Part): string[] {
  if (part.type === "list") return Array.isArray(part.items) ? part.items.map((item) => inlineText(item)) : [];
  if (part.type === "quote") return [String(part.text ?? ""), ...(typeof part.source === "string" ? [part.source] : [])];
  if (part.type === "photo") return typeof part.caption === "string" ? [part.caption] : [];
  return [inlineText(part.text)];
}

/** Characters of text in a post body, links as their visible text. */
export function bodyLength(body: unknown): number {
  return parts(body).reduce((sum, part) => sum + partTexts(part).reduce((n, t) => n + t.replace(/\]\([^)]*\)/g, "").replace(/\[/g, "").length, 0), 0);
}

function partLines(part: Part, n: number, ctx: Ctx): string[] {
  if (part.type === "heading") return [`Part ${n} (heading, level ${String(part.level)}): ${quote(inlineText(part.text))}`];
  if (part.type === "paragraph") return [`Part ${n} (paragraph): ${quote(inlineText(part.text))}`];
  if (part.type === "list") {
    const items = Array.isArray(part.items) ? part.items : [];
    return [`Part ${n} (${part.style === "number" ? "numbered" : "bulleted"} list):`, ...items.map((item, i) => `  ${part.style === "number" ? `${i + 1}.` : "-"} ${quote(inlineText(item))}`)];
  }
  if (part.type === "quote") return [`Part ${n} (quote): ${quote(part.text)}${typeof part.source === "string" ? `, said by ${quote(part.source)}` : ""}`];
  if (part.type === "photo") {
    const image = isObject(part.image) && typeof part.image.src === "string" && typeof part.image.alt === "string" ? photoText({ src: part.image.src, alt: part.image.alt, focus: part.image.focus }, ctx) : "Photo";
    return [`Part ${n} (photo): ${image}${typeof part.caption === "string" ? `, caption: ${quote(part.caption)}` : ""}`];
  }
  return [`Part ${n}: ${quote(part)}`];
}

const bodyLines = (body: unknown, ctx: Ctx): string[] => parts(body).flatMap((part, i) => partLines(part, i + 1, ctx));

function fieldsWithoutBody(def: CollectionDefinition): Field {
  const rest = Object.fromEntries(Object.entries(def.fields as Record<string, Field>).filter(([name]) => name !== "body"));
  return { kind: "object", label: "", fields: rest };
}

function withoutStatusAndBody(item: unknown): Record<string, unknown> {
  if (!isObject(item)) return {};
  return Object.fromEntries(Object.entries(item).filter(([name]) => name !== "status" && name !== "body"));
}

function whereItAppears(kind: string, slug: string): string {
  return kind === "posts" ? `at /blog/${slug} and in the list on /blog` : `in the ${kind} sections of your pages`;
}

function statusChange(kind: string, slug: string, from: string, to: string): string {
  const where = whereItAppears(kind, slug);
  if (to === "live" && from === "archived") return `Status: restore. It comes back on the live site, ${where}.`;
  if (to === "live") return `Status: publish. It goes live ${where}.`;
  if (to === "draft" && from === "archived") return "Status: restore as a draft. It stays off the live site until you publish it.";
  if (to === "draft") return `Status: save as a draft. It leaves the live site (it was ${where}) and stays here as a draft.`;
  return `Status: archive. It leaves the site (it was ${where}). Nothing is deleted; it can be brought back.`;
}

function itemSection(key: string, old: unknown, now: unknown, ctx: Ctx): string | null {
  const at = key.indexOf("/");
  const kind = key.slice(0, at);
  const slug = key.slice(at + 1);
  const def = collectionFor(kind);
  if (!def || !isObject(now) || deepEqual(old, now)) return null;
  const label = typeof now[def.labelField] === "string" ? (now[def.labelField] as string) : slug;
  const objectDef = fieldsWithoutBody(def);
  const hasBody = "body" in def.fields;
  const lines: string[] = [];

  if (!isObject(old)) {
    const live = now.status === "live";
    lines.push(`New ${def.singular} ${quote(label)} (${key}).`);
    lines.push(
      live
        ? `  Status: publish. It goes live ${whereItAppears(kind, slug)}.`
        : "  Status: save as a draft. It is not on the live site until the owner says to publish it.",
    );
    lines.push(...leaves(withoutStatusAndBody(now), objectDef, [], [], ctx).map((line) => `  ${line}`));
    if (hasBody && "body" in now) {
      lines.push("  Post:", ...bodyLines(now.body, ctx).map((line) => `    ${line}`));
    }
  } else {
    lines.push(`${def.singular[0].toUpperCase()}${def.singular.slice(1)} ${quote(label)} (${key}):`);
    if (old.status !== now.status) lines.push(`  ${statusChange(kind, slug, status(old), status(now))}`);
    const entries: Entry[] = [];
    diffValue(withoutStatusAndBody(old), withoutStatusAndBody(now), objectDef, [], entries, ctx);
    lines.push(...render(entries));
    if (hasBody && !deepEqual(old.body, now.body)) {
      lines.push("  Post, was:", ...bodyLines(old.body, ctx).map((line) => `    ${line}`));
      lines.push("  Post, now:", ...bodyLines(now.body, ctx).map((line) => `    ${line}`));
    }
  }
  const bodyChanged = !isObject(old) || !deepEqual(old.body, now.body);
  if (kind === "posts" && bodyChanged && bodyLength(now.body) > LONG_POST) lines.push(LONG_POST_LINE);
  return lines.join("\n");
}

/** One note per page whose list section would show nothing because the kind has no live item. */
function emptyListNotes(change: DocumentChange, registry: readonly AnyBlockDefinition[]): string[] {
  const notes: string[] = [];
  const touchedKinds = new Set(change.touchedItems.map((key) => key.slice(0, key.indexOf("/"))));
  for (const [kind, types] of listBlocks(registry)) {
    const live = [...change.after.items].some(([key, item]) => key.startsWith(`${kind}/`) && status(item) === "live");
    if (live) continue;
    for (const [path, page] of change.pages) {
      const blocks = isObject(page) && Array.isArray(page.blocks) ? page.blocks : [];
      const holds = blocks.some((block) => isObject(block) && typeof block.type === "string" && types.includes(block.type));
      if (holds && (touchedKinds.has(kind) || change.touchedPages.includes(path))) {
        notes.push(`Note: ${path} has a ${kind} section, and no ${collectionFor(kind)?.singular ?? "item"} is live. This section shows nothing until an item is live.`);
      }
    }
  }
  return notes;
}

// ---- settings ----

const B = BUSINESS_LABELS;
const BUSINESS_FIELDS: Field = {
  kind: "object",
  label: "",
  fields: {
    name: text(B.name),
    phone: text(B.phone),
    email: text(B.email),
    address: { kind: "list", label: B.address, min: 0, max: 4, of: text(B.addressLine) },
    hours: {
      kind: "object",
      label: B.hours,
      fields: Object.fromEntries(
        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => [
          day,
          { kind: "object", label: `${day[0].toUpperCase()}${day.slice(1)}`, fields: { opens: text(B.opens), closes: text(B.closes) } } as Field,
        ]),
      ),
    },
    hoursNote: text(B.hoursNote),
    social: { kind: "list", label: B.social, min: 0, max: 8, of: { kind: "object", label: B.socialLink, fields: { network: text(B.network), url: text(B.url) } } },
  },
};

const N = NOTICE_LABELS;
const NOTICE_FIELDS: Field = {
  kind: "object",
  label: "",
  fields: { text: text(N.text), link: { kind: "object", label: N.link, fields: { label: text(N.linkText), href: text(N.linkHref) } }, endsOn: text(N.endsOn) },
};

/** A null value as "nothing", so the diff prints it as an addition or a removal. */
const nothing = (value: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== null));

const COLOR_NAMES: Record<ColorToken, string> = {
  silver: "Page background",
  silver2: "Footer background",
  white: "White",
  ink: "Text",
  ink2: "Secondary text",
  green: "Brand color",
  greenDeep: "Deep brand color",
  greenEdge: "Brand edge color",
  tint: "Brand tint",
  glow: "Brand glow",
  mint: "Brand mint",
  rust: "Accent color",
  line: "Lines",
};

function fontLabel(role: FontRole, id: unknown): string {
  return CURATED_FONTS[role].find((font) => font.id === id)?.label ?? String(id);
}

function logoText(logo: unknown, ctx: Ctx): string {
  if (!isObject(logo) || typeof logo.src !== "string" || typeof logo.alt !== "string") return "(the business name as text)";
  const size = typeof logo.width === "number" && typeof logo.height === "number" ? `, ${logo.width} x ${logo.height} pixels` : "";
  return `${photoText({ src: logo.src, alt: logo.alt }, ctx)}${size}`;
}

function brandSection(old: Record<string, unknown>, now: Record<string, unknown>, ctx: Ctx): string {
  const lines = ["Brand settings:"];
  const was = isObject(old.colors) ? old.colors : {};
  const colors = isObject(now.colors) ? now.colors : {};
  const changed = (Object.keys(COLOR_NAMES) as ColorToken[]).filter((token) => was[token] !== colors[token]);
  for (const token of changed) lines.push(`  ${COLOR_NAMES[token]} (${token}): ${String(was[token])} → ${String(colors[token])}`);
  if (changed.length > 0) lines.push(`  All ${CONTRAST_PAIRS.length} color pairs keep AA contrast.`);
  const wasFonts = isObject(old.fonts) ? old.fonts : {};
  const fonts = isObject(now.fonts) ? now.fonts : {};
  for (const role of FONT_ROLES) {
    if (wasFonts[role] !== fonts[role]) lines.push(`  ${role[0].toUpperCase()}${role.slice(1)} font: ${fontLabel(role, wasFonts[role])} → ${fontLabel(role, fonts[role])}`);
  }
  if (!deepEqual(old.logo, now.logo)) lines.push("  Logo:", `    was: ${logoText(old.logo, ctx)}`, `    now: ${logoText(now.logo, ctx)}`);
  lines.push("  This changes how every page looks. Before it can be published, run preview_change for this proposal and give the owner the preview link to look at.");
  return lines.join("\n");
}

function noticeSection(old: Record<string, unknown>, now: Record<string, unknown>, today: string, ctx: Ctx): string {
  const lines = ["Notice:"];
  const entries: Entry[] = [];
  diffValue(nothing(old), nothing(now), NOTICE_FIELDS, [], entries, ctx);
  lines.push(...render(entries));
  const text = typeof now.text === "string" ? now.text.trim() : "";
  const endsOn = typeof now.endsOn === "string" ? now.endsOn : null;
  if (text === "") lines.push("  The notice comes down: it no longer shows on any page.");
  else if (endsOn !== null && endsOn < today) lines.push("  This notice will not show: its end date has passed.");
  else if (endsOn !== null) lines.push(`  The notice shows above the header on every page. Shows through ${endsOn}; it comes down at the first publish after that date.`);
  else lines.push("  The notice shows above the header on every page.");
  return lines.join("\n");
}

function businessSection(old: Record<string, unknown>, now: Record<string, unknown>, ctx: Ctx): string {
  const entries: Entry[] = [];
  diffValue(nothing(old), nothing(now), BUSINESS_FIELDS, [], entries, ctx);
  return ["Business details:", ...render(entries)].join("\n");
}

/** The change list's sections for the items and settings a change touches (items first, then business, brand, notice). */
export function documentSections(change: DocumentChange, ctx: Ctx, registry: readonly AnyBlockDefinition[]): string[] {
  const sections: string[] = [];
  for (const key of change.touchedItems) {
    const section = itemSection(key, change.before.items.get(key), change.after.items.get(key), ctx);
    if (section !== null) sections.push(section);
  }
  for (const name of SETTINGS_NAMES) {
    if (!change.touchedSettings.includes(name)) continue;
    const old = change.before.settings.get(name);
    const now = change.after.settings.get(name);
    if (!isObject(old) || !isObject(now)) continue;
    if (name === "business") sections.push(businessSection(old, now, ctx));
    else if (name === "brand") sections.push(brandSection(old, now, ctx));
    else sections.push(noticeSection(old, now, change.today, ctx));
  }
  const notes = emptyListNotes(change, registry);
  if (notes.length > 0) sections.push(notes.join("\n"));
  return sections;
}
