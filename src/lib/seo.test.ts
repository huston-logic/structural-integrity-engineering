import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { seo } from "../content/seo.ts";
import { readPageFiles } from "./page-files.ts";

// Every page's title and description: the page files in src/content/pages (one per page) and the thank-you page, which is
// still a route (src/content/seo.ts). The same rules as before the pages became files.
const pages = readPageFiles().map(({ file, data }) => {
  const page = data as { title: string; description: string };
  return [file.replace(/\.json$/, ""), { title: page.title, description: page.description }] as const;
});
const entries: (readonly [string, { title: string; description: string }])[] = [...pages, ...Object.entries(seo)];
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

describe("seo entries", () => {
  it("reads every page file and the thank-you page", () => {
    assert.equal(pages.length, 8);
    assert.deepEqual(
      pages.map(([name]) => name).sort(),
      ["about-us", "contact-us", "home", "privacy", "services", "services--glazing-and-mullion-engineering", "services--low-rise-commercial-structural-design", "services--residential-structural-design"],
    );
    assert.equal(entries.length, pages.length + 1);
  });

  it("has unique titles and descriptions", () => {
    const titles = entries.map(([, e]) => e.title);
    assert.equal(new Set(titles).size, titles.length);
    const descriptions = entries.map(([, e]) => e.description);
    assert.equal(new Set(descriptions).size, descriptions.length);
  });

  it("keeps descriptions under 155 characters and free of placeholders", () => {
    for (const [key, e] of entries) {
      assert.ok(!e.title.includes("[["), `${key} title`);
      assert.ok(e.title.length > 0, `${key} title empty`);
      assert.ok(e.description.length > 0, `${key} description empty`);
      assert.ok(e.description.length < 155, `${key} description is ${e.description.length} characters`);
      assert.ok(!e.description.includes("[["), `${key} description`);
    }
  });

  it("keeps every page title within 60 characters, so search results do not cut it", () => {
    for (const [key, e] of entries) {
      assert.ok(e.title.length <= 60, `${key} title is ${e.title.length} characters: ${e.title}`);
    }
  });

  it("gives every page a meta description", () => {
    const missing = entries.filter(([, e]) => e.description.trim() === "").map(([k]) => k);
    assert.deepEqual(missing, []);
  });

  it("uses only whole sentences from the copy deck, when the deck is present", (t) => {
    const deckPath = new URL("../../incoming/sie-site-assets/copy-deck.md", import.meta.url);
    if (!existsSync(deckPath)) {
      t.skip("copy deck is git-ignored and absent (CI)");
      return;
    }
    const deck = norm(readFileSync(deckPath, "utf8"));
    for (const [key, e] of entries) {
      assert.ok(deck.includes(norm(e.description)), `${key} description is not verbatim deck text`);
      assert.ok(/[.!?]$/.test(e.description), `${key} description is not whole sentences`);
    }
  });
});
