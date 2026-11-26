import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { LoadedItem } from "../collections/schema.ts";
import { pickItems } from "./collections.ts";
import { readPageFiles } from "./page-files.ts";
import { auditRoutes, blogRoutes, indexableRoutes, noindexRoutes, pageRoutes, postSlugs } from "./routes.ts";

const slugs = (n: number) => Array.from({ length: n }, (_, i) => `post-${i + 1}`);

describe("blogRoutes", () => {
  it("10 live posts have no page 2; 11 have /blog/page/2 and never /blog/page/1", () => {
    assert.deepEqual(blogRoutes(slugs(10), slugs(10)).indexPages, []);
    assert.deepEqual(blogRoutes(slugs(11), slugs(11)).indexPages, ["/blog/page/2"]);
  });
  it("lists every live post, newest first as given", () => {
    assert.deepEqual(blogRoutes(["b", "a"], ["b", "a"]).posts, ["/blog/b", "/blog/a"]);
  });
  it("a draft post is built but never indexable", () => {
    const r = blogRoutes(["a"], ["wip", "a"]);
    assert.deepEqual(r.posts, ["/blog/a"]);
    assert.deepEqual(r.draftPosts, ["/blog/wip"]);
  });
});

describe("post order", () => {
  const post = (slug: string, status: LoadedItem["status"], date: string): LoadedItem => ({ kind: "posts", slug, status, data: { date } });
  const all = [post("old", "live", "2026-01-01"), post("new", "live", "2026-03-01"), post("wip", "draft", "2026-04-01"), post("gone", "archived", "2026-05-01")];
  it("the route list and the pages (pickItems) list the same posts in the same order, with and without drafts", () => {
    for (const drafts of [false, true]) assert.deepEqual(postSlugs(all, drafts), pickItems(all, "posts", drafts).map((item) => item.slug));
    assert.deepEqual(postSlugs(all, true), ["wip", "new", "old"]);
  });
});

describe("the route lists of this repo", () => {
  it("audit routes are the pages plus at most the newest post and page 2", () => {
    assert.deepEqual(auditRoutes.slice(0, pageRoutes.length), pageRoutes);
    assert.ok(auditRoutes.length <= pageRoutes.length + 2);
  });
  it("the sitemap holds every audited route and no noindex route", () => {
    for (const route of auditRoutes) assert.ok(indexableRoutes.includes(route), route);
    for (const route of noindexRoutes) assert.ok(!indexableRoutes.includes(route), route);
  });
  it("the blog page is a page route only while blog.json is live (it is archived on this site, D12)", () => {
    const blog = readPageFiles().find(({ data }) => (data as { path?: string }).path === "/blog");
    const live = (blog?.data as { status?: string } | undefined)?.status === "live";
    assert.equal(pageRoutes.includes("/blog"), live);
    if (!live) assert.deepEqual(indexableRoutes.filter((route) => route.startsWith("/blog")), []);
  });
});
