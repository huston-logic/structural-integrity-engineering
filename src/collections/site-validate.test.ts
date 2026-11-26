import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONTACT_PATH, fileForPath, type AnyBlockDefinition } from "../blocks/schema.ts";
import type { Repo } from "../blocks/validate.ts";
import business from "../content/business.json" with { type: "json" };
import notice from "../content/notice.json" with { type: "json" };
import brandFixture from "../brand/fixtures/template-brand.json" with { type: "json" };
import { BRAND_FIXED, SITE_SETTINGS_NAMES } from "../settings/names.ts";
import type { ItemFile } from "./schema.ts";
import { toLoadedItems, validateSite } from "./site-validate.ts";
import type { SiteInput } from "./site-validate.ts";

const repo: Repo = { imageExists: (src) => src.startsWith("/images/"), fileExists: () => true };

const base: AnyBlockDefinition = {
  type: "first",
  title: "First",
  description: "Opens a page.",
  source: "library",
  fields: { heading: { kind: "text", label: "Heading", max: 40 } },
  variants: [{ name: "a", description: "a" }],
  placement: { position: "first", maxPerPage: 1, rhythm: "hero" },
  motion: { entrance: "default" },
  example: { heading: "x" },
};
const postIndex: AnyBlockDefinition = { ...base, type: "post-index", placement: { position: "any", maxPerPage: 1, rhythm: "section", onlyOn: "/blog" } };
const registry = [base, postIndex];

const page = (path: string, extra: unknown[] = [], status = "live") => ({
  file: path === "/" ? "home.json" : fileForPath(path),
  data: { path, title: "t", description: "d", status, blocks: [{ type: "first", content: { heading: "x" } }, ...extra] },
});
const index = { type: "post-index", content: { heading: "x" } };
const post = (data: Record<string, unknown> = {}): ItemFile => ({
  kind: "posts",
  slug: "hello",
  data: { status: "live", title: "T", description: "D", date: "2026-03-27", body: [{ type: "paragraph", text: "Hi" }], ...data },
});
const site = (over: Partial<SiteInput> = {}): SiteInput => ({ pages: [page("/"), page(CONTACT_PATH)], items: [], forms: [], business, notice, ...over });
const has = (problems: string[], text: string) => assert.ok(problems.some((p) => p.includes(text)), `${text} in ${JSON.stringify(problems)}`);

describe("validateSite", () => {
  it("passes a good site", () => {
    assert.deepEqual(validateSite(site(), registry, repo), []);
  });

  it("brand is fixed on this site: no brand.json is needed, and one that appears is refused (SITE-DIFFERENCES D11)", () => {
    assert.equal(BRAND_FIXED, true);
    assert.deepEqual(SITE_SETTINGS_NAMES, ["business", "notice"]);
    has(validateSite(site({ brand: brandFixture }), registry, repo), "src/content/brand.json is not used on this site");
    has(validateSite(site({ settingsErrors: { brand: "is not valid JSON (x)." } }), registry, repo), "src/content/brand.json is not used on this site");
  });

  it("a live post without a /blog page fails, and a draft post does not", () => {
    has(validateSite(site({ items: [post()] }), registry, repo), "/blog must be a live page");
    assert.deepEqual(validateSite(site({ items: [post({ status: "draft" })] }), registry, repo), []);
  });

  it("a live post needs /blog to be live and to hold a post-index block", () => {
    has(validateSite(site({ items: [post()], pages: [page("/"), page(CONTACT_PATH), page("/blog", [])] }), registry, repo), "/blog must be a live page");
    has(validateSite(site({ items: [post()], pages: [page("/"), page(CONTACT_PATH), page("/blog", [index], "archived")] }), registry, repo), "/blog must be a live page");
    assert.deepEqual(validateSite(site({ items: [post()], pages: [page("/"), page(CONTACT_PATH), page("/blog", [index])] }), registry, repo), []);
  });

  it("post-index is allowed only on /blog", () => {
    has(validateSite(site({ pages: [page("/", [index]), page(CONTACT_PATH)] }), registry, repo), "can only be used on the page /blog");
  });

  it("judges item links against the page index and item images against the repo", () => {
    const withLink = post({ body: [{ type: "paragraph", text: ["See ", { text: "this", href: "/nowhere" }] }] });
    has(validateSite(site({ items: [withLink] }), registry, repo), "/nowhere");
    const withImage = post({ status: "draft", body: [{ type: "photo", image: { src: "/images/missing/none.jpg", alt: "A bright window over a table" } }] });
    const strict: Repo = { imageExists: () => false, fileExists: () => true };
    has(validateSite(site({ items: [withImage] }), registry, strict), "none.jpg");
  });

  it("reports a missing or unreadable settings file by name, not as a crash", () => {
    const problems = validateSite(site({ business: undefined, notice: undefined, settingsErrors: { notice: "is not valid JSON (x)." } }), registry, repo);
    has(problems, "src/content/business.json is missing");
    has(problems, "src/content/notice.json is not valid JSON");
  });

  it("orders problems: pages, items, settings, then cross rules", () => {
    const problems = validateSite(
      site({ pages: [page("/"), { file: fileForPath(CONTACT_PATH), data: { path: CONTACT_PATH } }], items: [post({ title: "" })], business: undefined }),
      registry,
      repo,
    );
    const at = (text: string) => problems.findIndex((p) => p.includes(text));
    assert.ok(at(fileForPath(CONTACT_PATH)) >= 0 && at(fileForPath(CONTACT_PATH)) < at("posts/hello.json"), JSON.stringify(problems));
    assert.ok(at("posts/hello.json") < at("business.json is missing"));
    assert.ok(at("business.json is missing") < at("/blog must be a live page"));
  });
});

describe("toLoadedItems", () => {
  it("splits the status from the fields and leaves out unreadable items", () => {
    const bad: ItemFile = { kind: "posts", slug: "bad", data: undefined, error: "x" };
    const [only, ...rest] = toLoadedItems([post(), bad]);
    assert.equal(rest.length, 0);
    assert.equal(only?.status, "live");
    assert.equal(only?.data["status"], undefined);
    assert.equal(only?.data["title"], "T");
  });
});
