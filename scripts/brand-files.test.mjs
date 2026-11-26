// Tests for the files generated from a brand.json (src/app/palette.css and src/lib/fonts.ts): the generators and the drift
// report in scripts/config-rules.mjs (brandFiles, driftedFiles). Brand is fixed on this site (docs/SITE-DIFFERENCES.md,
// D11): there is no src/content/brand.json and nothing is generated from one, so the generators are tested on the
// template's own default brand (src/brand/fixtures/template-brand.json) and the site's own files are tested to be what
// they have always been.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { GENERATED_BRAND_FILES, FONTS_PATH, PALETTE_PATH } from "../src/brand/generated.ts";
import { BRAND_FIXED, SITE_SETTINGS_NAMES } from "../src/settings/names.ts";
import { brandFiles, driftedFiles } from "./config-rules.mjs";
import { rules } from "./change-scope-rules.mjs";

const brand = JSON.parse(readFileSync(new URL("../src/brand/fixtures/template-brand.json", import.meta.url), "utf8"));
const read = (files) => (path) => files[path] ?? null;

describe("brand is fixed on this site", () => {
  test("no brand.json, no generated palette file, and the scope rules name no generated files", () => {
    assert.equal(BRAND_FIXED, true);
    assert.deepEqual([...SITE_SETTINGS_NAMES], ["business", "notice"]);
    assert.equal(existsSync(new URL("../src/content/brand.json", import.meta.url)), false);
    assert.equal(existsSync(new URL("../src/app/palette.css", import.meta.url)), false);
    assert.deepEqual([...GENERATED_BRAND_FILES], []);
    assert.deepEqual([...rules.generatedFiles], []);
    assert.ok(!rules.settingsFiles.includes(rules.brandFile));
  });

  test("fonts.ts is the one sync:config writes from site.config.ts theme.fonts, not from a brand.json", () => {
    const text = readFileSync(new URL("../src/lib/fonts.ts", import.meta.url), "utf8");
    assert.match(text, /generated from site\.config\.ts theme\.fonts/);
    assert.doesNotMatch(text, /brand\.json/);
  });
});

describe("the brand generators (kept as the template has them, tested on the template's default brand)", () => {
  test("the generator names the two files", () => {
    assert.deepEqual(Object.keys(brandFiles(brand)).sort(), [FONTS_PATH, PALETTE_PATH].sort());
  });

  test("a palette.css that differs from brand.json is reported with the differing line", () => {
    const generated = brandFiles(brand);
    const stale = { ...generated, "src/app/palette.css": generated["src/app/palette.css"].replace(brand.colors.green, "#000000") };
    const drift = driftedFiles(generated, read(stale));
    assert.equal(drift.length, 1);
    assert.match(drift[0], /src\/app\/palette\.css/);
    assert.match(drift[0], /--hl-green: #000000/);
  });

  test("a fonts.ts that differs from brand.json is reported", () => {
    const generated = brandFiles(brand);
    const other = brandFiles({ ...brand, fonts: { ...brand.fonts, display: "fraunces", body: "work-sans" } });
    const drift = driftedFiles(generated, read({ ...generated, "src/lib/fonts.ts": other["src/lib/fonts.ts"] }));
    assert.equal(drift.length, 1);
    assert.match(drift[0], /src\/lib\/fonts\.ts/);
  });

  test("a missing generated file counts as drift", () => {
    assert.equal(driftedFiles(brandFiles(brand), () => null).length, 2);
  });

  test("a font that is not curated and a color that is not #rrggbb are refused", () => {
    assert.throws(() => brandFiles({ ...brand, fonts: { ...brand.fonts, body: "comic-sans" } }), /not an allowed body font/);
    assert.throws(() => brandFiles({ ...brand, colors: { ...brand.colors, green: "blue" } }), /#rrggbb/);
  });
});
