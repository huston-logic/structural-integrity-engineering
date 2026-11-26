import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { finishBuild } from "./finish-build.mjs";

function fakeOut() {
  const outDir = mkdtempSync(join(tmpdir(), "finish-build-"));
  writeFileSync(join(outDir, "index.html"), "home");
  writeFileSync(join(outDir, "blocks.html"), "showcase");
  writeFileSync(join(outDir, "blocks.txt"), "showcase");
  mkdirSync(join(outDir, "blocks"));
  writeFileSync(join(outDir, "blocks", "index.txt"), "showcase");
  return outDir;
}
const stamp = (outDir) => JSON.parse(readFileSync(join(outDir, "site-version.json"), "utf8"));

test("the stamp uses WORKERS_CI_COMMIT_SHA first, then GITHUB_SHA, then null", () => {
  const a = fakeOut();
  assert.equal(finishBuild({ outDir: a, env: { WORKERS_CI_COMMIT_SHA: "aaa", GITHUB_SHA: "bbb" }, productionBranch: "main" }).commit, "aaa");
  assert.equal(stamp(a).commit, "aaa");
  const b = fakeOut();
  assert.equal(finishBuild({ outDir: b, env: { GITHUB_SHA: "bbb" }, productionBranch: "main" }).commit, "bbb");
  assert.equal(stamp(b).commit, "bbb");
  const c = fakeOut();
  assert.equal(finishBuild({ outDir: c, env: {}, productionBranch: "main" }).commit, null);
  assert.equal(stamp(c).commit, null);
});

test("the stamp is valid JSON with an ISO build time", () => {
  const outDir = fakeOut();
  finishBuild({ outDir, env: {}, productionBranch: "main" });
  const { builtAt } = stamp(outDir);
  assert.equal(new Date(builtAt).toISOString(), builtAt);
});

test("the showcase is removed only on the production branch", () => {
  const prod = fakeOut();
  assert.equal(finishBuild({ outDir: prod, env: { WORKERS_CI_BRANCH: "main" }, productionBranch: "main" }).showcaseRemoved, true);
  for (const name of ["blocks.html", "blocks.txt", "blocks"]) assert.equal(existsSync(join(prod, name)), false, name);
  assert.equal(existsSync(join(prod, "index.html")), true);

  const preview = fakeOut();
  assert.equal(finishBuild({ outDir: preview, env: { WORKERS_CI_BRANCH: "change/owner-1" }, productionBranch: "main" }).showcaseRemoved, false);
  assert.equal(existsSync(join(preview, "blocks.html")), true);
});

test("a Workers Builds build with no branch is treated as production; with another branch it is not", () => {
  for (const env of [{ WORKERS_CI: "1" }, { WORKERS_CI: "1", WORKERS_CI_BRANCH: "" }]) {
    const outDir = fakeOut();
    assert.equal(finishBuild({ outDir, env, productionBranch: "main" }).showcaseRemoved, true);
    assert.equal(existsSync(join(outDir, "blocks.html")), false);
  }
  const preview = fakeOut();
  assert.equal(finishBuild({ outDir: preview, env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "feat/x" }, productionBranch: "main" }).showcaseRemoved, false);
});

test("nothing is removed when neither variable is set, or when productionBranch is missing", () => {
  const local = fakeOut();
  assert.equal(finishBuild({ outDir: local, env: {}, productionBranch: undefined }).showcaseRemoved, false);
  assert.equal(finishBuild({ outDir: local, env: { WORKERS_CI_BRANCH: undefined }, productionBranch: "" }).showcaseRemoved, false);
  assert.equal(existsSync(join(local, "blocks.html")), true);
  assert.equal(finishBuild({ outDir: local, env: { WORKERS_CI_BRANCH: "" }, productionBranch: "" }).showcaseRemoved, false);
});

test("a CI build (GITHUB_SHA, no Workers Builds branch) keeps the showcase", () => {
  const outDir = fakeOut();
  const result = finishBuild({ outDir, env: { GITHUB_SHA: "ccc" }, productionBranch: "main" });
  assert.deepEqual(result, { commit: "ccc", showcaseRemoved: false });
  assert.equal(existsSync(join(outDir, "blocks", "index.txt")), true);
});

test("a production build still succeeds when the showcase files are already absent", () => {
  const outDir = mkdtempSync(join(tmpdir(), "finish-build-"));
  assert.equal(finishBuild({ outDir, env: { WORKERS_CI_BRANCH: "main" }, productionBranch: "main" }).showcaseRemoved, true);
});
