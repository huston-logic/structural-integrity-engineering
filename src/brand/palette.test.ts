import assert from "node:assert/strict";
import { test } from "node:test";
import brand from "./fixtures/template-brand.json" with { type: "json" };
import type { Palette } from "./contrast-pairs.ts";
import { paletteCss } from "./palette.ts";

const colors = brand.colors as Palette;

test("paletteCss writes the 13 tokens in order, matching hl.css's names", () => {
  assert.equal(
    paletteCss(colors),
    `/* Generated from src/content/brand.json by \`npm run sync:config\`. Do not edit by hand. */
:root {
  --hl-silver: #f5f5f4;
  --hl-silver-2: #e7e5e4;
  --hl-white: #ffffff;
  --hl-ink: #1c1917;
  --hl-ink-2: #44403c;
  --hl-green: #1e4fa3;
  --hl-green-deep: #173b7a;
  --hl-green-edge: #5b85c9;
  --hl-tint: #e8eefa;
  --hl-glow: #c3d4f0;
  --hl-mint: #d5e1f5;
  --hl-rust: #9a3412;
  --hl-line: #d6d3d1;
}
`,
  );
});

test("paletteCss lowercases a valid color", () => {
  assert.match(paletteCss({ ...colors, green: "#1E4FA3" }), /--hl-green: #1e4fa3;/);
});

test("paletteCss throws on anything that is not #rrggbb, so no style value can slip in", () => {
  for (const bad of ["red", "#fff", "#1e4fa3; } body { display: none", "url(x)", "", "#1e4fa3 "]) {
    assert.throws(() => paletteCss({ ...colors, green: bad }), /must be #rrggbb/, bad);
  }
  const missing = { ...colors } as Partial<Palette>;
  delete missing.rust;
  assert.throws(() => paletteCss(missing as Palette));
});
