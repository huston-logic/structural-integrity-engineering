import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { gitIn } from "./check-change-scope.mjs";
import { contentLaneRoutes, main } from "./content-lane.mjs";

const menu = { label: "About", order: 20, places: ["header"] };
const page = (extra = {}) => ({ title: "T", status: "live", blocks: [], ...extra });
const f = (path, status = "M") => ({ status, path });
const lane = (files, pagesBase, pagesHead) => contentLaneRoutes({ files, pagesBase, pagesHead });

test("a content edit returns the changed live routes, sorted", () => {
  const both = { "/": page(), "/about": page(), "/faq": page() };
  assert.deepEqual(lane([f("src/content/pages/faq.json"), f("src/content/pages/home.json")], both, both), ["/", "/faq"]);
});

test("a changed file that is not a page file means scan everything", () => {
  const pages = { "/about": page() };
  assert.equal(lane([f("src/content/pages/about.json"), f("src/content/nav.ts")], pages, pages), null);
  assert.equal(lane([f("src/content/pages/a/b.json")], pages, pages), null);
});

test("a menu change (added, removed or edited) means scan everything", () => {
  const plain = { "/about": page() };
  const withMenu = { "/about": page({ menu }) };
  const files = [f("src/content/pages/about.json")];
  assert.equal(lane(files, plain, withMenu), null);
  assert.equal(lane(files, withMenu, plain), null);
  assert.equal(lane(files, withMenu, { "/about": page({ menu: { ...menu, label: "Us" } }) }), null);
  assert.deepEqual(lane(files, withMenu, { "/about": page({ menu }) }), ["/about"]);
});

test("a status change on a page with a menu means scan everything; without a menu it does not", () => {
  const files = [f("src/content/pages/about.json")];
  assert.equal(lane(files, { "/about": page({ menu }) }, { "/about": page({ menu, status: "archived" }) }), null);
  assert.deepEqual(lane(files, { "/about": page({ status: "archived" }) }, { "/about": page() }), ["/about"]);
});

test("a deleted or renamed page file means scan everything", () => {
  const pages = { "/about": page() };
  assert.equal(lane([f("src/content/pages/about.json", "D")], pages, {}), null);
  assert.equal(lane([f("src/content/pages/about.json", "R")], pages, pages), null);
});

test("a new page is a content change", () => {
  assert.deepEqual(lane([f("src/content/pages/new.json", "A")], {}, { "/new": page() }), ["/new"]);
});

test("when every changed page is archived, scan the home page so something runs", () => {
  const files = [f("src/content/pages/old.json")];
  assert.deepEqual(lane(files, { "/old": page() }, { "/old": page({ status: "archived" }) }), ["/"]);
});

// ---- the command line on a throwaway repository ---------------------------------------------------------------

function inRepo(setup, env = { GITHUB_BASE_REF: "main" }, argv = ["--ci"]) {
  const dir = mkdtempSync(join(tmpdir(), "lane-repo-"));
  const git = gitIn(dir);
  const commit = (m) => git(["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m", m]);
  const write = (path, content) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  };
  try {
    git(["init", "-q", "-b", "main"]);
    write("src/content/pages/home.json", JSON.stringify(page()));
    write("src/content/pages/about.json", JSON.stringify(page({ menu })));
    write("src/content/nav.ts", "export const a = 1;\n");
    git(["add", "-A"]);
    commit("base");
    git(["update-ref", "refs/remotes/origin/main", "HEAD"]);
    git(["checkout", "-q", "-b", "feat/x"]);
    setup({ write });
    git(["add", "-A"]);
    commit("change");
    const out = [];
    const errs = [];
    const code = main({ argv, env, git, out: (t) => out.push(t), err: (t) => errs.push(t) });
    return { code, out, errs };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("CLI prints one CONTENT_LANE_ROUTES line for a content-only pull request", () => {
  const { code, out } = inRepo(({ write }) => {
    write("src/content/pages/about.json", JSON.stringify(page({ title: "New", menu })));
    write("src/content/pages/home.json", JSON.stringify(page({ title: "New" })));
  });
  assert.equal(code, 0);
  assert.deepEqual(out, ["CONTENT_LANE_ROUTES=/,/about"]);
});

test("CLI prints nothing when a non-page file changed", () => {
  const { code, out } = inRepo(({ write }) => write("src/content/nav.ts", "export const a = 2;\n"));
  assert.equal(code, 0);
  assert.deepEqual(out, []);
});

test("CLI prints nothing outside a pull request", () => {
  const { code, out } = inRepo(({ write }) => write("src/content/pages/home.json", JSON.stringify(page({ title: "N" }))), {});
  assert.equal(code, 0);
  assert.deepEqual(out, []);
});

test("CLI exits 2 with a message on stderr when git fails", () => {
  const { code, out, errs } = inRepo(({ write }) => write("src/content/pages/home.json", "{}"), { GITHUB_BASE_REF: "nope" });
  assert.equal(code, 2);
  assert.deepEqual(out, []);
  assert.match(errs[0], /could not read the git history/);
});

test("a change to brand.json, a generated brand file, an item or business.json means scan everything", () => {
  const pages = { "/about": page() };
  const aboutFile = f("src/content/pages/about.json");
  for (const path of [
    "src/content/brand.json",
    "src/app/palette.css",
    "src/lib/fonts.ts",
    "src/content/business.json",
    "src/content/notice.json",
    "src/content/collections/posts/spring-news.json",
  ]) {
    assert.equal(lane([f(path)], pages, pages), null, path);
    assert.equal(lane([aboutFile, f(path, "A")], pages, pages), null, `${path} beside a page file`);
  }
});
