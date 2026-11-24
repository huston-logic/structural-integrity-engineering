import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { seo } from "../content/seo.ts";

const entries = Object.entries(seo) as [string, { title: string; description: string | null }][];
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

describe("seo entries", () => {
  it("has unique titles and descriptions", () => {
    const titles = entries.map(([, e]) => e.title);
    assert.equal(new Set(titles).size, titles.length);
    const descriptions = entries.map(([, e]) => e.description).filter((d): d is string => d !== null);
    assert.equal(new Set(descriptions).size, descriptions.length);
  });

  it("keeps descriptions under 155 characters and free of placeholders", () => {
    for (const [key, e] of entries) {
      assert.ok(!e.title.includes("[["), `${key} title`);
      assert.ok(e.title.length > 0, `${key} title empty`);
      if (e.description === null) continue;
      assert.ok(e.description.length < 155, `${key} description is ${e.description.length} characters`);
      assert.ok(!e.description.includes("[["), `${key} description`);
    }
  });

  it("allows no description only on the privacy page", () => {
    const missing = entries.filter(([, e]) => e.description === null).map(([k]) => k);
    assert.deepEqual(missing, ["privacy"]);
  });

  it("uses only whole sentences from the copy deck, when the deck is present", (t) => {
    const deckPath = new URL("../../incoming/sie-site-assets/copy-deck.md", import.meta.url);
    if (!existsSync(deckPath)) {
      t.skip("copy deck is git-ignored and absent (CI)");
      return;
    }
    const deck = norm(readFileSync(deckPath, "utf8"));
    for (const [key, e] of entries) {
      if (e.description === null) continue;
      assert.ok(deck.includes(norm(e.description)), `${key} description is not verbatim deck text`);
      assert.ok(/[.!?]$/.test(e.description), `${key} description is not whole sentences`);
    }
  });
});
