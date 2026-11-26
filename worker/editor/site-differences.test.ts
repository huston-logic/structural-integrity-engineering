import assert from "node:assert/strict";
import { test } from "node:test";
import { fileForPath, pathForFile } from "../../src/blocks/schema.ts";
import { makeTestEditor, seedSite } from "./test-support.ts";

// The two ways this site differs from the template that reach the editor (docs/SITE-DIFFERENCES.md, D2 and D7).

const OWNER = { email: "owner@example.test" };
const GLAZING = "/services/residential-structural-design";
const GLAZING_FILE = "services--residential-structural-design.json";

const twoLevelPage = JSON.stringify(
  {
    path: GLAZING,
    title: "Residential structural design",
    description: "Structural design for homes.",
    status: "live",
    blocks: [
      { type: "hero", content: { title: "Residential structural design" } },
      { type: "prose", content: { heading: "What we do", paragraphs: ["We design the frame.", "We stamp the drawings."] } },
    ],
  },
  null,
  2,
) + "\n";

const withTwoLevelPage = () => makeTestEditor({ github: seedSite({ [`src/content/pages/${GLAZING_FILE}`]: twoLevelPage }) });

test("a two-level path and its file name map both ways", () => {
  assert.equal(fileForPath(GLAZING), GLAZING_FILE);
  assert.equal(pathForFile(GLAZING_FILE), GLAZING);
});

test("the editor lists and reads a two-level page by its path", async () => {
  const t = withTwoLevelPage();
  const overview = await t.editor.overview();
  const paths = (overview.data as { pages: { path: string }[] }).pages.map((p) => p.path);
  assert.ok(paths.includes(GLAZING), paths.join(", "));
  const page = await t.editor.page(GLAZING);
  assert.equal(page.isError ?? false, false, page.text);
  assert.ok(page.text.includes("We stamp the drawings."));
});

test("a change to a two-level page is proposed, published and written to its own file", async () => {
  const t = withTwoLevelPage();
  const proposed = await t.editor.propose(
    { summary: "Change the second line", operations: [{ op: "set", page: GLAZING, pointer: "/blocks/1/content/paragraphs/1", value: "We stamp and sign the drawings." }] },
    OWNER,
  );
  assert.ok(!proposed.isError, proposed.text);
  assert.ok(proposed.text.includes(`Page ${GLAZING} ("Residential structural design"):`), proposed.text);
  assert.ok(proposed.text.includes('now: "We stamp and sign the drawings."'), proposed.text);
  const { proposal_id: id } = proposed.data as { proposal_id: string };
  const published = await t.editor.publish(id, "Yes, go ahead.", OWNER);
  assert.ok(!published.isError, published.text);
  const files = t.github.filesOn(t.github.pulls[0]?.headRef ?? "");
  assert.match(files[`src/content/pages/${GLAZING_FILE}`] ?? "", /We stamp and sign the drawings\./);
});

test("a new two-level page is written to a file named with --", async () => {
  const t = makeTestEditor();
  const page = {
    path: "/services/new-service",
    title: "New service",
    description: "A new service.",
    status: "live",
    blocks: [{ type: "hero", content: { title: "New service" } }],
  };
  const proposed = await t.editor.propose({ summary: "Add a service", operations: [{ op: "add_page", page }] }, OWNER);
  assert.ok(!proposed.isError, proposed.text);
  const { proposal_id: id } = proposed.data as { proposal_id: string };
  assert.ok(!(await t.editor.publish(id, "Yes.", OWNER)).isError);
  const files = t.github.filesOn(t.github.pulls[0]?.headRef ?? "");
  assert.ok("src/content/pages/services--new-service.json" in files, Object.keys(files).join(", "));
});

test("a page with a menu is refused, and the list says the menu is set by Huston Logic", async () => {
  const t = makeTestEditor();
  const proposed = await t.editor.propose(
    {
      summary: "Put Hours in the menu",
      operations: [{ op: "set", page: "/hours", pointer: "/menu", value: { label: "Hours", order: 40, places: ["footer"] } }],
    },
    OWNER,
  );
  assert.equal(proposed.isError, true);
  assert.match(proposed.text, /The menu on this site is set by Huston Logic/);
  assert.match(proposed.text, /Nothing was changed\./);
  assert.equal(t.github.pulls.length, 0);
});
