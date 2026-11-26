import assert from "node:assert/strict";
import { test } from "node:test";
import { registry } from "../../src/blocks/definitions.ts";
import { addedPlaceholders, buildChangeList, matchBlockIds } from "./change-list.ts";
import { applyOperations } from "./operations.ts";

const page = (path: string, extra: Record<string, unknown> = {}) => ({
  path,
  title: "Opening hours",
  description: "When we are open.",
  status: "live",
  blocks: [] as unknown[],
  ...extra,
});
const faq = (n: number) => ({ type: "faq", content: { heading: `Heading ${n}`, items: [{ question: `Q${n}a?`, answer: `A${n}a` }, { question: `Q${n}b?`, answer: `A${n}b` }] } });
const hours = () =>
  page("/hours", {
    menu: { label: "Hours", order: 10, places: ["header", "footer"] },
    blocks: [
      { type: "hero", content: { title: "Hours" } },
      { type: "closing-cta", content: { heading: "Call", body: "Soon", action: { label: "Book", href: "@booking" } } },
      faq(3),
      { type: "hero", content: { title: "Four" } },
      { type: "hero", content: { title: "Five" } },
    ],
  });

function run(ops: unknown[], pages: unknown[] = [hours()], hinted = true): { text: string; placeholders: string[] } {
  const before = new Map(pages.map((p) => [(p as { path: string }).path, p]));
  const result = applyOperations(before, ops);
  assert.ok(result.ok, result.ok ? "" : result.problems.join("; "));
  return { text: buildChangeList(before, result.after, result.ids, registry, hinted ? result.moved : []), placeholders: addedPlaceholders(before, result.after) };
}

test("a changed answer names the block, list and entry with the field labels", () => {
  const { text } = run([{ op: "set", page: "/hours", pointer: "/blocks/2/content/items/1/answer", value: "Friday: 9 to 3" }]);
  assert.equal(
    text,
    ['Page /hours ("Opening hours"):', '  Block 3 (Questions and answers), Questions, entry 2, Answer:', '    was: "A3b"', '    now: "Friday: 9 to 3"'].join("\n"),
  );
});

test("a changed title, description and menu are separate lines", () => {
  const { text } = run([
    { op: "set", page: "/hours", pointer: "/title", value: "New title" },
    { op: "set", page: "/hours", pointer: "/menu/label", value: "Open" },
  ]);
  assert.match(text, /  Title:\n    was: "Opening hours"\n    now: "New title"/);
  assert.match(text, /  Menu, Label:\n    was: "Hours"\n    now: "Open"/);
});

test("a nested action field uses its labels", () => {
  const { text } = run([{ op: "set", page: "/hours", pointer: "/blocks/1/content/action/label", value: "Call me" }]);
  assert.match(text, /Block 2 \(.*\), .*, Label:\n    was: "Book"\n    now: "Call me"/);
});

test("a move says from block 4 to block 3", () => {
  const { text } = run([{ op: "move_block", page: "/hours", from: 4, to: 3 }], [hours()], false);
  assert.match(text, /Block "[^"]+" moves from block 4 to block 3\./);
  assert.doesNotMatch(text, /was:/);
});

test("a move reports the block that was moved", () => {
  const { text } = run([{ op: "move_block", page: "/hours", from: 3, to: 2 }]);
  assert.match(text, /Block "Questions and answers" moves from block 3 to block 2\./);
  assert.doesNotMatch(text, /Closing/);
  const three = page("/c", { blocks: [{ type: "hero", content: { title: "H" } }, { type: "closing-cta", content: { heading: "Call", body: "Soon", action: { label: "Book", href: "@booking" } } }, faq(3)] });
  const ops = [{ op: "move_block", page: "/c", from: 3, to: 2 }];
  assert.match(run(ops, [three], true).text, /Block "Questions and answers" moves from block 3 to block 2\./);
  assert.match(run(ops, [three], false).text, /moves from block 2 to block 3\./);
});

test("a removal quotes the removed text", () => {
  const { text } = run([{ op: "remove_block", page: "/hours", block: 3 }]);
  assert.match(text, /Removes block 3 \(Questions and answers\), which said:\n {4}Heading: "Heading 3"\n {4}Questions, entry 1, Question: "Q3a\?"/);
});

test("an inserted block lists its fields at its new position", () => {
  const { text } = run([{ op: "insert_block", page: "/hours", at: 2, block: faq(9) }]);
  assert.match(text, /Adds block 2 \(Questions and answers\):\n {4}Heading: "Heading 9"/);
});

test("an inserted list entry and a removed one are listed", () => {
  const added = run([{ op: "insert_item", page: "/hours", pointer: "/blocks/2/content/items", at: 3, value: { question: "Q?", answer: "A" } }]).text;
  assert.match(added, /Block 3 \(Questions and answers\), Questions, entry 3:\n {4}adds:\n {6}Question: "Q\?"\n {6}Answer: "A"/);
  const removed = run([{ op: "remove_item", page: "/hours", pointer: "/blocks/2/content/items", at: 1 }]).text;
  assert.match(removed, /Questions, entry 1:\n {4}removes:\n {6}Question: "Q3a\?"/);
});

test("a new page lists its menu places and every block", () => {
  const added = page("/videos", {
    title: "Videos",
    menu: { label: "Videos", order: 20, places: ["header"] },
    blocks: [faq(1), { type: "hero", content: { title: "Watch" } }],
  });
  const { text } = run([{ op: "add_page", page: added }]);
  assert.match(text, /^New page \/videos \("Videos"\), in the header menu as "Videos"\n {2}Description: "When we are open\."\n {2}Block 1 \(Questions and answers\):\n {4}Heading: "Heading 1"/);
  assert.match(text, /Block 2 \(.*\):\n {4}Headline: "Watch"/);
});

test("archive and restore say what happens to the menu", () => {
  const archived = run([{ op: "archive_page", page: "/hours" }]).text;
  assert.match(archived, /Archives \/hours: it leaves the site, the header menu and the footer menu\. Nothing is deleted; it can be brought back\./);
  const dead = { ...hours(), status: "archived", menu: { label: "Careers", order: 1, places: ["header"] } };
  const restored = run([{ op: "restore_page", page: "/hours" }], [dead]).text;
  assert.match(restored, /Brings back \/hours, in the header menu as "Careers"\./);
  const bare = run([{ op: "archive_page", page: "/hours" }], [page("/hours")]).text;
  assert.match(bare, /it leaves the site\. Nothing is deleted/);
});

test("untouched pages do not appear, and an unchanged proposal gives an empty list", () => {
  const { text } = run([{ op: "move_block", page: "/hours", from: 2, to: 2 }]);
  assert.equal(text, "");
});

test("markup in a value is shown only as quoted text", () => {
  const evil = "<script>alert(1)</script>";
  const { text } = run([{ op: "set", page: "/hours", pointer: "/blocks/0/content/title", value: evil }]);
  assert.ok(text.includes(`now: "${evil}"`));
  assert.equal(text.split(evil).length, 2);
});

test("an unknown block type falls back to the key names", () => {
  const odd = page("/odd", { blocks: [{ type: "mystery", content: { thing: "a" } }] });
  const { text } = run([{ op: "set", page: "/odd", pointer: "/blocks/0/content/thing", value: "b" }], [odd]);
  assert.match(text, /Block 1 \(mystery\), thing:\n {4}was: "a"\n {4}now: "b"/);
});

test("a new placeholder is reported; an existing one that stays is not", () => {
  const withOld = page("/hours", { blocks: [{ type: "hero", content: { title: "[[old]]" } }] });
  const keep = run([{ op: "set", page: "/hours", pointer: "/title", value: "Fine" }], [withOld]);
  assert.deepEqual(keep.placeholders, []);
  const added = run([{ op: "set", page: "/hours", pointer: "/blocks/0/content/title", value: "[[old]] and [[old]]" }], [withOld]);
  assert.deepEqual(added.placeholders, ['Page /hours: adds the placeholder "[[old]]"; write the real text instead.']);
  const fresh = run([{ op: "set", page: "/hours", pointer: "/description", value: "[[x]]" }], [withOld]);
  assert.deepEqual(fresh.placeholders, ['Page /hours: adds the placeholder "[[x]]"; write the real text instead.']);
});

test("matchBlockIds: equal blocks keep their id, a same-position same-type block takes the id, others are new", () => {
  const a = { type: "hero", content: { title: "A" } };
  const b = { type: "faq", content: { heading: "B", items: [] } };
  const c = { type: "hero", content: { title: "C" } };
  const before = new Map<string, unknown>([["/x", page("/x", { blocks: [a, b, c] })]]);
  const after = new Map<string, unknown>([
    ["/x", page("/x", { blocks: [{ type: "hero", content: { title: "A changed" } }, c, { type: "prose", content: { heading: "N", paragraphs: [] } }] }) ],
    ["/new", page("/new", { blocks: [a] })],
  ]);
  const ids = matchBlockIds(before, after);
  assert.deepEqual(ids.before.get("/x"), ["/x#1", "/x#2", "/x#3"]);
  assert.deepEqual(ids.after.get("/x"), ["/x#1", "/x#3", null]);
  assert.deepEqual(ids.after.get("/new"), [null]);
});

test("an edited block is named by its place on the new page, a removed one by its old place", () => {
  const { text } = run([
    { op: "insert_block", page: "/hours", at: 1, block: { type: "hero", content: { title: "New opening" } } },
    { op: "set", page: "/hours", pointer: "/blocks/1/content/title", value: "Hours, updated" },
  ]);
  assert.match(text, /Adds block 1 \(/);
  assert.match(text, /Block 2 \(.*\), Headline:\n {4}was: "Hours"\n {4}now: "Hours, updated"/);
  assert.equal(text.includes("moves from"), false);
  const removed = run([{ op: "remove_block", page: "/hours", block: 2 }]).text;
  assert.match(removed, /Removes block 2 \(/);
});
