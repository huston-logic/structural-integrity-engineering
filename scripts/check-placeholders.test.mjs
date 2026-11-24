// Tests for scripts/check-placeholders.mjs: how the launch gate treats contact.schedulerUrl and contact.linkedInUrl.
// The script is copied into a throwaway folder with a fixture site.config.ts (the real config, with the two settings
// changed), so nothing in the repo is read or written.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const repo = new URL("..", import.meta.url).pathname;
const { siteConfig } = await import(pathToFileURL(join(repo, "site.config.ts")).href);

function gate(overrides) {
  const dir = mkdtempSync(join(tmpdir(), "check-placeholders-"));
  try {
    mkdirSync(join(dir, "scripts"));
    mkdirSync(join(dir, "src/content"), { recursive: true });
    mkdirSync(join(dir, "src/app"), { recursive: true });
    copyFileSync(join(repo, "scripts/check-placeholders.mjs"), join(dir, "scripts/check-placeholders.mjs"));
    const config = structuredClone(siteConfig);
    // Everything else the gate needs is filled in, so only the settings under test can fail it.
    config.contact.turnstileSiteKey = "0x4AAAAAAAfixture";
    config.domain.url = "https://fixture.test";
    Object.assign(config.contact, overrides);
    writeFileSync(join(dir, "site.config.ts"), `export const siteConfig = ${JSON.stringify(config)};\n`);
    const run = spawnSync(process.execPath, [join(dir, "scripts/check-placeholders.mjs")], { encoding: "utf8" });
    return { status: run.status, output: `${run.stdout}${run.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("a fully set config with a booking link and LinkedIn URL passes", () => {
  const result = gate({ schedulerUrl: "https://cal.example/book", linkedInUrl: "https://linkedin.com/in/x" });
  assert.equal(result.status, 0, result.output);
});

test('"none" is a deliberate answer for the booking link and LinkedIn', () => {
  const result = gate({ schedulerUrl: "none", linkedInUrl: "none" });
  assert.equal(result.status, 0, result.output);
});

test("null (not decided) fails and names the setting", () => {
  for (const key of ["schedulerUrl", "linkedInUrl"]) {
    const result = gate({ schedulerUrl: "none", linkedInUrl: "none", [key]: null });
    assert.equal(result.status, 1);
    assert.match(result.output, new RegExp(`contact\\.${key} is still null`));
  }
});

test('a string that is neither "none" nor an http(s) URL fails', () => {
  for (const bad of ["None", "n/a", "cal.example/book", "[[Booking link]]", ""]) {
    const result = gate({ schedulerUrl: bad, linkedInUrl: "none" });
    assert.equal(result.status, 1, `schedulerUrl ${JSON.stringify(bad)}`);
    assert.match(result.output, /contact\.schedulerUrl/);
  }
});
