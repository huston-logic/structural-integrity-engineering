// Tests for the pure parts of scripts/change-report.mjs (which pages a change touches, option parsing, the markdown).
// The screenshots themselves need a browser and are checked by hand. Run with:
//   node --test scripts/change-report.test.mjs   (or `npm run test:scripts`)
import assert from "node:assert/strict";
import { test } from "node:test";
import { rules } from "./change-scope-rules.mjs";
import { evaluateChange, formatReport } from "./check-change-scope.mjs";
import { affectedPages, buildReportMarkdown, extractOptions, findImporters, routeForPageFile, slugForRoute } from "./change-report.mjs";

const allRoutes = ["/", "/services", "/about", "/contact", "/privacy", "/contact/thanks"];
const pageRoutes = {
  "src/app/(site)/page.tsx": "/",
  "src/app/(site)/services/page.tsx": "/services",
  "src/app/(site)/about/page.tsx": "/about",
  "src/app/(site)/contact/page.tsx": "/contact",
  "src/app/(site)/privacy/page.tsx": "/privacy",
  "src/app/(site)/contact/thanks/page.tsx": "/contact/thanks",
};
const sources = {
  "src/app/(site)/page.tsx": 'import { homeHero } from "@/content/home";\nimport { Hero } from "@/components/hl/Hero";',
  "src/app/(site)/about/page.tsx": "import { aboutBody } from '@/content/about';\nimport { Button } from \"@/components/hl/Button\";",
  "src/app/(site)/services/page.tsx": 'import { servicesHero } from "@/content/services";\nimport { Button } from "@/components/hl/Button";',
  "src/app/(site)/contact/page.tsx": 'import { contactHero } from "@/content/contact";',
  "src/app/(site)/privacy/page.tsx": 'import { privacy } from "@/content/privacy";',
  "src/app/(site)/contact/thanks/page.tsx": 'import { thanks } from "@/content/contact";',
  "src/app/(site)/layout.tsx": 'import { SiteChrome } from "@/components/layout/SiteChrome";',
  "src/components/layout/SiteChrome.tsx": 'import { nav } from "@/content/nav";',
  "src/components/hl/Button.tsx": "export function Button() {}",
  "src/components/hl/Hero.tsx": 'import { homeBackdrop } from "@/content/home-art";',
  "src/content/home.ts": 'export const homeHero = { image: "/images/home/hero.jpg" };',
  "src/content/home-art.ts": 'import { base } from "./home";',
  "src/content/about.ts": 'export const aboutBody = { photo: "/images/about/portrait.webp" };',
  "src/content/nav.ts": "export const nav = [];",
  "src/content/contact.ts": 'import { providers } from "./providers";',
  "src/content/providers.ts": "export const providers = {};",
};
const change = (...entries) => entries.map(([status, path]) => ({ status, path }));
const pages = (files) => affectedPages({ files, sources, pageRoutes, allRoutes });
const routes = (files) => pages(files).map((p) => p.route);

test("routeForPageFile and slugForRoute", () => {
  assert.equal(routeForPageFile("src/app/(site)/page.tsx"), "/");
  assert.equal(routeForPageFile("src/app/(site)/faq/page.tsx"), "/faq");
  assert.equal(routeForPageFile("src/app/(site)/contact/thanks/page.tsx"), "/contact/thanks");
  assert.equal(routeForPageFile("src/app/(site)/layout.tsx"), null);
  assert.equal(routeForPageFile("src/app/not-found.tsx"), null);
  assert.equal(slugForRoute("/"), "home");
  assert.equal(slugForRoute("/contact/thanks"), "contact-thanks");
  assert.equal(slugForRoute("/about"), "about");
});

test("findImporters finds alias, relative and image-path references", () => {
  assert.deepEqual(findImporters("src/content/about.ts", sources), ["src/app/(site)/about/page.tsx"]);
  assert.deepEqual(findImporters("src/content/home.ts", sources).sort(), ["src/app/(site)/page.tsx", "src/content/home-art.ts"].sort());
  assert.deepEqual(findImporters("public/images/about/portrait.webp", sources), ["src/content/about.ts"]);
  assert.deepEqual(findImporters("public/images/unused.jpg", sources), []);
  assert.deepEqual(findImporters("site.config.ts", sources), []);
});

test("a content change touches only the pages that use it", () => {
  assert.deepEqual(routes(change(["M", "src/content/about.ts"])), ["/about"]);
  assert.deepEqual(routes(change(["M", "src/content/services.ts"])), ["/services"]);
});

test("content used through other modules reaches the pages that import those", () => {
  // home.ts is imported by the home page and by home-art.ts, which the Hero component imports; the home page imports Hero.
  assert.deepEqual(routes(change(["M", "src/content/home.ts"])), ["/"]);
  // contact.ts is imported by the contact and thanks pages directly.
  assert.deepEqual(routes(change(["M", "src/content/contact.ts"])), ["/contact", "/contact/thanks"]);
});

test("a change that reaches the shared layout touches every page", () => {
  assert.deepEqual(routes(change(["M", "src/content/nav.ts"])), [...allRoutes].sort());
});

test("a photo is traced to the pages that show it; an unreferenced one touches every page", () => {
  assert.deepEqual(routes(change(["A", "public/images/about/portrait.webp"])), ["/about"]);
  assert.deepEqual(routes(change(["M", "public/images/about/portrait.webp"])), ["/about"]);
  assert.deepEqual(routes(change(["A", "public/images/unused.jpg"])), [...allRoutes].sort());
});

test("files that cannot be traced touch every page, and files with no visual effect touch none", () => {
  assert.deepEqual(routes(change(["M", "site.config.ts"])), [...allRoutes].sort());
  assert.deepEqual(routes(change(["M", "docs/STATUS.md"], ["M", "scripts/preview.mjs"], ["M", ".github/workflows/ci.yml"], ["M", "tests/a11y/x.ts"], ["M", "README.md"], ["M", "src/lib/routes.ts"])), []);
});

test("a new page has an after only, a deleted page a before only", () => {
  const added = pages(change(["A", "src/app/(site)/faq/page.tsx"], ["M", "src/lib/routes.ts"]));
  const faq = added.find((p) => p.route === "/faq");
  assert.deepEqual([faq.before, faq.after], [false, true]);
  const deleted = pages(change(["D", "src/app/(site)/privacy/page.tsx"]));
  assert.deepEqual(deleted.map((p) => [p.route, p.before, p.after]), [["/privacy", true, false]]);
});

test("every page carries its slug and the reason it was picked", () => {
  const [about] = pages(change(["M", "src/content/about.ts"]));
  assert.equal(about.slug, "about");
  assert.match(about.reason, /src\/content\/about\.ts/);
});

test("extractOptions splits the report's own options from the scope check's", () => {
  assert.deepEqual(extractOptions(["--base", "main", "--base-out", "/tmp/b", "--out", "r", "--head-out", "o", "--ci"]), {
    options: { baseOut: "/tmp/b", out: "r", headOut: "o" },
    rest: ["--base", "main", "--ci"],
  });
  assert.deepEqual(extractOptions([]), { options: { baseOut: undefined, out: "change-report", headOut: "out" }, rest: [] });
  assert.match(extractOptions(["--out"]).error, /--out/);
});

test("the markdown report lists the scope result and a before and after for each page", () => {
  const md = buildReportMarkdown({
    scopeText: "Tier 1: this change only touches content (1 file).\nResult: PASS.",
    base: "origin/main",
    head: "HEAD",
    pages: [
      { route: "/about", slug: "about", before: true, after: true, reason: "src/content/about.ts changed" },
      { route: "/faq", slug: "faq", before: false, after: true, reason: "new page" },
    ],
    viewports: [{ name: "phone", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 900 }],
  });
  assert.match(md, /^# Change report/);
  assert.match(md, /Tier 1: this change only touches content/);
  assert.match(md, /### \/about/);
  assert.match(md, /!\[before, phone\]\(about\/before-phone\.png\)/);
  assert.match(md, /!\[after, desktop\]\(about\/after-desktop\.png\)/);
  assert.match(md, /### \/faq/);
  assert.doesNotMatch(md, /faq\/before-/);
  assert.match(md, /new page, no before/i);
  assert.match(md, /390 × 844/);
});

test("a photo change puts its alt text and its problems in the report, and photographs the pages that show it", () => {
  const photo = (path, head, extra = {}) => ({ path, status: "A", added: [], removed: [], head, size: 1000, ...extra });
  const jpegHead = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
  const used = [{ path: "src/content/home.ts", content: 'export const homeHero = { image: "/images/home/hero.jpg", alt: "Dylan at the front counter" };\n' }];
  const result = evaluateChange(
    {
      files: [photo("public/images/home/hero.jpg", jpegHead), photo("public/images/home/leak.jpg", jpegHead, { metadata: { removed: ["EXIF (camera and location data)"] } })],
      existsAtBase: () => false,
      imageRefs: { "public/images/home/hero.jpg": used },
    },
    rules,
  );
  const scopeText = formatReport(result, { mode: "strict", base: "origin/main", head: "HEAD" });
  const md = buildReportMarkdown({ scopeText, base: "origin/main", head: "HEAD", pages: [], viewports: [] });
  assert.match(md, /public\/images\/home\/hero\.jpg: alt "Dylan at the front counter"/);
  assert.match(md, /Alt text problems/);
  assert.match(md, /leak\.jpg.*not used/);
  assert.match(md, /npm run strip:images/);
  const pages = affectedPages({ files: [{ status: "A", path: "public/images/home/hero.jpg" }], sources, pageRoutes, allRoutes });
  assert.deepEqual(pages.map((p) => p.route), ["/"]);
});

test("the markdown report says so when no page is affected", () => {
  const md = buildReportMarkdown({ scopeText: "x", base: "a", head: "b", pages: [], viewports: [] });
  assert.match(md, /No visible page is affected/i);
});

test("the markdown report's code fence cannot be closed by backticks inside the scope text", () => {
  const md = buildReportMarkdown({ scopeText: "evil ``` still inside\n## fake heading", base: "a", head: "b", pages: [], viewports: [] });
  assert.match(md, /````text\nevil ``` still inside\n## fake heading\n````\n/);
});
