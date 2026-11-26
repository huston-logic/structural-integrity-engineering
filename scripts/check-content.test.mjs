import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { CONTACT_PATH, defineBlock, fileForPath, GENERIC_ALT_WORDS, THANKS_PATH } from "../src/blocks/schema.ts";
import { embedOrigins, embedUrl, parseVideoUrl, videoProviders, watchUrl } from "../src/blocks/embeds.ts";
import { MENU_REFUSED, validateContent, validatePages, validateRegistry } from "../src/blocks/validate.ts";
import { thanksPageLinks } from "../src/lib/thanks-links.ts";
import { livePages, pathForFile, readPageFiles } from "../src/lib/page-files.ts";
import { rules } from "./change-scope-rules.mjs";

const motion = { entrance: "default" };
const base = { source: "library", motion, variants: [{ name: "plain", description: "The only look." }, { name: "wide", description: "Wider." }] };

const hero = defineBlock({
  ...base,
  type: "hero",
  title: "Hero",
  description: "Opens a page with a headline.",
  fields: {
    eyebrow: { kind: "text", label: "Eyebrow", max: 40, required: false },
    title: { kind: "text", label: "Title", max: 80 },
    action: { kind: "action", label: "Button", labelMax: 30, required: false },
  },
  placement: { position: "first", maxPerPage: 1, rhythm: "hero" },
  example: { title: "A headline" },
});

const faq = defineBlock({
  ...base,
  type: "faq",
  title: "FAQ",
  description: "Questions and answers.",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    items: { kind: "list", label: "Questions", min: 1, max: 8, of: { kind: "object", label: "Item", fields: { question: { kind: "text", label: "Question", max: 100 }, answer: { kind: "text", label: "Answer", max: 400 } } } },
  },
  placement: { position: "any", maxPerPage: 2, rhythm: "section" },
  example: { heading: "Questions", items: [{ question: "Why?", answer: "Because." }] },
});

const closing = defineBlock({
  ...base,
  type: "closing-cta",
  title: "Closing call to action",
  description: "Ends a page with one action.",
  fields: { heading: { kind: "text", label: "Heading", max: 80 }, action: { kind: "action", label: "Button", labelMax: 30 } },
  placement: { position: "last", maxPerPage: 1, rhythm: "section" },
  example: { heading: "Ready?", action: { label: "Book", href: "@booking" } },
});

const form = defineBlock({
  ...base,
  type: "contact-form",
  title: "Contact form",
  description: "The booking column and the form.",
  fields: { heading: { kind: "text", label: "Heading", max: 80 } },
  placement: { position: "any", maxPerPage: 1, rhythm: "section" },
  fixedAnchor: "book",
  example: { heading: "Get in touch" },
});

const picture = defineBlock({
  ...base,
  type: "picture",
  title: "Picture",
  description: "One picture with a caption.",
  fields: { image: { kind: "image", label: "Picture" }, link: { kind: "link", label: "Link", required: false } },
  placement: { position: "any", maxPerPage: 3, rhythm: "section" },
  example: { image: { src: "/images/a.jpg", alt: "The shop front on a sunny morning" } },
});

const video = defineBlock({
  ...base,
  type: "video",
  title: "Video",
  description: "One video.",
  fields: { video: { kind: "video", label: "Video address" }, style: { kind: "choice", label: "Style", options: ["calm", "bold"], required: false }, loud: { kind: "boolean", label: "Loud", required: false } },
  placement: { position: "any", maxPerPage: 4, rhythm: "section" },
  example: { video: "https://youtu.be/dQw4w9WgXcQ" },
});

const spark = defineBlock({
  ...base,
  type: "spark",
  title: "Spark",
  description: "A block with a focal animation (test fixture).",
  fields: { heading: { kind: "text", label: "Heading", max: 40 } },
  placement: { position: "any", maxPerPage: 3, rhythm: "section" },
  motion: { entrance: "default", signature: { keyframes: "spark", reason: "The one focal animation of the page." } },
  example: { heading: "Spark" },
});

const registry = [hero, faq, closing, form, picture, video, spark];
const repo = { imageExists: (src) => src === "/images/a.jpg" };

const block = (type, content, extra = {}) => ({ type, content, ...extra });
const heroBlock = () => block("hero", { title: "Welcome" });
const page = (path, blocks, extra = {}) => ({ path, title: "A page", description: "What this page is about.", status: "live", blocks, ...extra });
const home = (blocks = [heroBlock()]) => ({ file: "home.json", data: page("/", blocks) });
const contact = () => ({ file: fileForPath(CONTACT_PATH), data: page(CONTACT_PATH, [heroBlock(), block("contact-form", { heading: "Hi" })]) });
const check = (...pages) => validatePages([home(), contact(), ...pages], registry, repo);
const checkHome = (blocks) => validatePages([home(blocks), contact()], registry, repo);
const aboutWith = (blocks, extra) => ({ file: "about.json", data: page("/about", blocks, extra) });

test("accepts a valid page", () => {
  const about = aboutWith([heroBlock(), block("faq", { heading: "Q", items: [{ question: "Why?", answer: "**Because** [[maybe]]." }] }, { anchor: "faq" }), block("closing-cta", { heading: "Go", action: { label: "Book", href: `${CONTACT_PATH}#book` } })]);
  assert.deepEqual(check(about), []);
});

// This site's menu is src/content/nav.ts (SITE-DIFFERENCES D7), so a page file's menu is refused, however well formed.
const menuRefused = (problems) => problems.filter((p) => p.includes('"menu" cannot be used here'));
const withoutRefusal = (problems) => problems.filter((p) => !p.includes('"menu" cannot be used here'));

test("a menu on a page file is refused with a plain message", () => {
  const about = aboutWith([heroBlock()], { menu: { label: "About", order: 2, places: ["header", "footer"] } });
  assert.deepEqual(check(about), [MENU_REFUSED("about.json")]);
  assert.match(MENU_REFUSED("about.json"), /The menu on this site is set by Huston Logic/);
  assert.equal(menuRefused(check(aboutWith([heroBlock()]))).length, 0);
});

test("reports unreadable JSON by file", () => {
  const problems = validatePages([home(), contact(), { file: "about.json", data: undefined, error: "is not valid JSON (Unexpected token). Look for a comma." }], registry, repo);
  assert.deepEqual(problems, ["about.json: is not valid JSON (Unexpected token). Look for a comma."]);
});

test("reports a bad top-level value and bad keys", () => {
  const problems = validatePages([{ file: "home.json", data: [] }, contact()], registry, repo);
  assert.ok(problems.some((p) => p.startsWith("home.json: a page file must hold one object")));
  const extra = check({ file: "about.json", data: { ...page("/about", [heroBlock()]), colour: "red", title: undefined } });
  assert.ok(extra.some((p) => p.includes('"colour" is not a page field')));
  assert.ok(extra.some((p) => p.includes('"title" is missing')));
});

test("unknown block type", () => {
  const problems = checkHome([heroBlock(), block("carousel", {})]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /^home\.json, block 2 \(carousel\): unknown block type "carousel"\. Known types: hero, faq/);
});

test("unknown field", () => {
  const problems = checkHome([block("hero", { title: "Hi", colour: "red" })]);
  assert.deepEqual(problems, ['home.json, block 1 (hero): "colour" is not a field this block accepts. It accepts: eyebrow, title, action.']);
});

test("missing required", () => {
  const problems = checkHome([block("hero", {})]);
  assert.deepEqual(problems, ['home.json, block 1 (hero): "title" is required.']);
});

test("text too long", () => {
  const problems = checkHome([block("hero", { title: "x".repeat(81) })]);
  assert.deepEqual(problems, ['home.json, block 1 (hero): "title" is 81 characters; this block takes at most 80.']);
});

test("too many items", () => {
  const items = Array.from({ length: 9 }, () => ({ question: "Q", answer: "A" }));
  const problems = checkHome([heroBlock(), block("faq", { heading: "Q", items })]);
  assert.deepEqual(problems, ['home.json, block 2 (faq): "items" has 9 entries; this block takes at most 8.']);
  const none = checkHome([heroBlock(), block("faq", { heading: "Q", items: [] })]);
  assert.deepEqual(none, ['home.json, block 2 (faq): "items" has 0 entries; this block needs at least 1.']);
});

test("nested fields are named by entry", () => {
  const problems = checkHome([heroBlock(), block("faq", { heading: "Q", items: [{ question: "Q" }, { question: "Q", answer: "A", extra: 1 }] })]);
  assert.deepEqual(problems, [
    'home.json, block 2 (faq): "items" entry 1, "answer" is required.',
    'home.json, block 2 (faq): "items" entry 2, "extra" is not a field this entry accepts. It accepts: question, answer.',
  ]);
});

test("HTML or markdown link in text", () => {
  for (const [text, word] of [["Hello <b>there</b>", "HTML tag"], ["a <!-- x -->", "HTML tag"], ["Fish &amp; chips", "HTML entity"], ["Tom &#38; Jerry", "HTML entity"], ["See [this](https://x.com)", "markdown link"], ["Two\nlines", "control character"]]) {
    const problems = checkHome([block("hero", { title: text })]);
    assert.equal(problems.length, 1, text);
    assert.ok(problems[0].includes(word), `${text}: ${problems[0]}`);
  }
  assert.deepEqual(checkHome([block("hero", { title: "1 < 2 and **bold** [[later]] A & B" })]), []);
});

test("javascript:, vbscript: and data: links", () => {
  for (const [href, word] of [["javascript:alert(1)", "javascript:"], ["JavaScript:alert(1)", "javascript:"], [" javascript:x", "javascript:"], ["vbscript:msgbox(1)", "vbscript:"], ["VBScript:x", "vbscript:"], ["data:text/html,hi", "data:"]]) {
    const problems = checkHome([block("hero", { title: "Hi", action: { label: "Go", href } })]);
    assert.equal(problems.length, 1, href);
    assert.ok(problems[0].includes(word), `${href}: ${problems[0]}`);
  }
});

test("http: link", () => {
  const problems = checkHome([block("hero", { title: "Hi", action: { label: "Go", href: "http://example.com" } })]);
  assert.match(problems[0], /is an http: link; use https/);
  const relative = checkHome([block("hero", { title: "Hi", action: { label: "Go", href: "//evil.example/x" } })]);
  assert.match(relative[0], /starts with \/\//);
});

test("other link forms", () => {
  const ok = ["https://example.com/a?b=1", "mailto:hi@example.com", "tel:+1-555-0100", CONTACT_PATH, "/", THANKS_PATH, "@booking"];
  for (const href of ok) assert.deepEqual(checkHome([block("hero", { title: "Hi", action: { label: "Go", href } })]), [], href);
  const bad = ["https://", "https://user:pw@example.com", "mailto:", "mailto:a b@example.com", "tel:abc", "tel:12", "about", "#top", "ftp://x.com", "/About", "/a/b", "https://exa mple.com"];
  for (const href of bad) assert.equal(checkHome([block("hero", { title: "Hi", action: { label: "Go", href } })]).length, 1, href);
});

test("internal link to missing page", () => {
  const problems = checkHome([block("hero", { title: "Hi", action: { label: "Go", href: "/nowhere" } })]);
  assert.match(problems[0], /"\/nowhere" points to \/nowhere, which is not a page on this site/);
});

test("archived target", () => {
  const about = aboutWith([heroBlock()], {});
  about.data.status = "archived";
  const problems = validatePages([home([block("hero", { title: "Hi", action: { label: "Go", href: "/about" } })]), contact(), about], registry, repo);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /points to \/about, which is archived/);
});

test("missing anchor", () => {
  const about = aboutWith([heroBlock(), block("faq", { heading: "Q", items: [{ question: "Q", answer: "A" }] }, { anchor: "faq" })]);
  const link = (href) => home([block("hero", { title: "Hi", action: { label: "Go", href } })]);
  assert.deepEqual(validatePages([link("/about#faq"), contact(), about], registry, repo), []);
  assert.deepEqual(validatePages([link(`${CONTACT_PATH}#book`), contact(), about], registry, repo), []);
  const problems = validatePages([link("/about#story"), contact(), about], registry, repo);
  assert.match(problems[0], /points to #story on \/about, but that page has no section with that anchor/);
  assert.equal(validatePages([link("/#faq"), contact(), about], registry, repo).length, 1);
});

test("@booking accepted", () => {
  assert.deepEqual(checkHome([block("hero", { title: "Hi", action: { label: "Book", href: "@booking" } })]), []);
  assert.deepEqual(checkHome([heroBlock(), block("picture", { image: { src: "/images/a.jpg", alt: "The shop front" }, link: "@booking" })]), []);
});

test("image missing or generic alt", () => {
  const withImage = (image) => checkHome([heroBlock(), block("picture", { image })]);
  assert.deepEqual(withImage({ src: "/images/a.jpg", alt: "A baker holding a loaf" }), []);
  assert.match(withImage({ src: "/images/b.jpg", alt: "A baker holding a loaf" })[0], /is not a file in public\/images/);
  assert.match(withImage({ src: "https://x.com/a.jpg", alt: "A baker holding a loaf" })[0], /is not an image under \/images\//);
  assert.match(withImage({ src: "/images/a.svg", alt: "A baker holding a loaf" })[0], /is not an image under \/images\//);
  assert.match(withImage({ src: "/images/a.jpg" })[0], /"alt" is required/);
  for (const alt of ["", "photo", "A photo", "the image of", "Images", "Pictures of", "logo", "IMG_1234", "DSC00123.jpg", "dog.jpg", "ab", "[[describe it]]", "TBD", "alt text"]) {
    const problems = withImage({ src: "/images/a.jpg", alt });
    assert.equal(problems.length, 1, JSON.stringify(alt));
  }
});

test("video not on allowlist", () => {
  const withVideo = (url) => checkHome([heroBlock(), block("video", { video: url })]);
  assert.deepEqual(withVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s"), []);
  assert.match(withVideo("https://example.com/v.mp4")[0], /is not an address this site can play. Use YouTube/);
  assert.match(withVideo("https://www.youtube.com/watch?v=short")[0], /not an address this site can play/);
  assert.equal(checkHome([heroBlock(), block("video", { video: "https://youtu.be/dQw4w9WgXcQ", style: "wild" })]).length, 1);
  assert.equal(checkHome([heroBlock(), block("video", { video: "https://youtu.be/dQw4w9WgXcQ", loud: "yes" })]).length, 1);
});

test("hero not first", () => {
  const problems = checkHome([block("faq", { heading: "Q", items: [{ question: "Q", answer: "A" }] }), heroBlock()]);
  assert.equal(problems.length, 2);
  assert.match(problems[0], /block 1 \(faq\): a page must open with a "hero" block; this page opens with "faq"/);
  assert.match(problems[1], /block 2 \(hero\): "hero" opens a page, so it can only be block 1/);
});

test("closing not last", () => {
  const problems = checkHome([heroBlock(), block("closing-cta", { heading: "Go", action: { label: "Go", href: "@booking" } }), block("picture", { image: { src: "/images/a.jpg", alt: "The shop front" } })]);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /block 2 \(closing-cta\): "closing-cta" closes a page, so it must be the last block; it is block 2 of 3/);
});

test("maxPerPage", () => {
  const faqBlock = () => block("faq", { heading: "Q", items: [{ question: "Q", answer: "A" }] });
  assert.deepEqual(checkHome([heroBlock(), faqBlock(), faqBlock()]), []);
  const problems = checkHome([heroBlock(), faqBlock(), faqBlock(), faqBlock()]);
  assert.deepEqual(problems, ['home.json, block 4 (faq): a page takes at most 2 blocks of type "faq".']);
});

test("one focal animation", () => {
  const spark1 = () => block("spark", { heading: "S" });
  const videoBlock = () => block("video", { video: "https://youtu.be/dQw4w9WgXcQ" });
  assert.deepEqual(checkHome([heroBlock(), videoBlock(), videoBlock(), spark1()]), []);
  const problems = checkHome([heroBlock(), spark1(), videoBlock(), spark1()]);
  assert.deepEqual(problems, ["home.json, block 4 (spark): a page may have only one focal animation, and block 2 already has it."]);
});

test("anchors and variants", () => {
  assert.match(checkHome([heroBlock(), block("faq", { heading: "Q", items: [{ question: "Q", answer: "A" }] }, { anchor: "Bad Anchor" })])[0], /"anchor" must be lowercase/);
  const faqAt = (anchor) => block("faq", { heading: "Q", items: [{ question: "Q", answer: "A" }] }, { anchor });
  assert.match(checkHome([heroBlock(), faqAt("same"), faqAt("same")])[0], /anchor "same" is already used by block 2/);
  assert.match(validatePages([home(), { file: fileForPath(CONTACT_PATH), data: page(CONTACT_PATH, [heroBlock(), faqAt("book"), block("contact-form", { heading: "Hi" })]) }], registry, repo)[0], /fixed anchor "book" is already used by block 2/);
  assert.match(validatePages([home(), { file: fileForPath(CONTACT_PATH), data: page(CONTACT_PATH, [heroBlock(), block("contact-form", { heading: "Hi" }, { anchor: "form" })]) }], registry, repo)[0], /fixed anchor \("book"\); remove "anchor"/);
  assert.match(checkHome([block("hero", { title: "Hi" }, { variant: "huge" })])[0], /variant "huge" does not exist; this block has: plain, wide/);
  assert.deepEqual(checkHome([block("hero", { title: "Hi" }, { variant: "wide" })]), []);
});

test("duplicate path", () => {
  const problems = check({ file: "about.json", data: page("/about", [heroBlock()]) }, { file: "about-us.json", data: page("/about", [heroBlock()]) });
  assert.ok(problems.some((p) => p.includes('about-us.json: the path "/about" is already used by about.json')), problems.join("\n"));
});

test("file name must match path", () => {
  const problems = check({ file: "about.json", data: page("/team", [heroBlock()]) });
  assert.deepEqual(problems, ['about.json: the file name must match the path. The path "/team" belongs in team.json.']);
  const homeProblems = validatePages([{ file: "home.json", data: page("/home", [heroBlock()]) }, contact()], registry, repo);
  assert.ok(homeProblems.some((p) => p.includes('The path "/home" belongs in home.json')) || homeProblems.some((p) => p.includes("must match")));
  assert.equal(pathForFile("home.json"), "/");
  assert.equal(pathForFile("about.json"), "/about");
});

test("a -- in a file name is the / of a two-level path, in both directions", () => {
  assert.equal(pathForFile("services--glazing.json"), "/services/glazing");
  assert.equal(pathForFile("src/content/pages/services--glazing-and-mullion.json"), "/services/glazing-and-mullion");
  assert.equal(fileForPath("/services/glazing"), "services--glazing.json");
  assert.equal(fileForPath("/about-us"), "about-us.json");
  for (const path of ["/", "/about-us", "/services/glazing", "/a/b-c"]) assert.equal(pathForFile(fileForPath(path)), path, path);
});

test("two-level page paths are accepted, and the file name must carry the --", () => {
  const nested = { file: "services--glazing.json", data: page("/services/glazing", [heroBlock()]) };
  assert.deepEqual(check(nested), []);
  const wrongName = check({ file: "glazing.json", data: page("/services/glazing", [heroBlock()]) });
  assert.deepEqual(wrongName, ['glazing.json: the file name must match the path. The path "/services/glazing" belongs in services--glazing.json.']);
  const slashName = check({ file: "services-glazing.json", data: page("/services/glazing", [heroBlock()]) });
  assert.deepEqual(slashName, ['services-glazing.json: the file name must match the path. The path "/services/glazing" belongs in services--glazing.json.']);
});

test("a path may be at most two levels deep and each part is lowercase words with hyphens", () => {
  for (const path of ["/a/b/c", "/Services/glazing", "/services/", "/services//glazing", "/services/a--b", "//a", "/a_b/c"]) {
    const problems = check({ file: fileForPath(path), data: page(path, [heroBlock()]) });
    assert.ok(problems.some((p) => p.includes(`the path "${path}" must be /, one lowercase word like /about-us, or two like /services/glazing`)), `${path}: ${problems.join(" | ")}`);
  }
});

test("a link to a two-level page points at its path and its anchors", () => {
  const nested = { file: "services--glazing.json", data: page("/services/glazing", [heroBlock(), block("faq", { heading: "Q", items: [{ question: "Q", answer: "A" }] }, { anchor: "faq" })]) };
  const link = (href) => home([block("hero", { title: "Hi", action: { label: "Go", href } })]);
  assert.deepEqual(validatePages([link("/services/glazing#faq"), contact(), nested], registry, repo), []);
  assert.equal(validatePages([link("/services/other"), contact(), nested], registry, repo).length, 1);
  assert.equal(validatePages([link("/services/glazing#nope"), contact(), nested], registry, repo).length, 1);
});

test("required pages live", () => {
  const missing = validatePages([home()], registry, repo);
  assert.deepEqual(missing, [`The page ${CONTACT_PATH} is missing; add ${fileForPath(CONTACT_PATH)}. The site needs it.`]);
  const archived = contact();
  archived.data.status = "archived";
  assert.match(validatePages([home(), archived], registry, repo)[0], new RegExp(`The page ${CONTACT_PATH} must be live`));
  assert.match(validatePages([contact()], registry, repo)[0], /The page \/ is missing; add home\.json/);
});

test("reserved path", () => {
  const problems = check({ file: "blocks.json", data: page("/blocks", [heroBlock()]) });
  assert.deepEqual(problems, ['blocks.json: the path "/blocks" is reserved by the site; choose another.']);
});

test("page rules: path, title, description, status, blocks", () => {
  const bad = (extra, file = "about.json", path = "/about") => check({ file, data: { ...page(path, [heroBlock()]), ...extra } });
  assert.match(bad({ title: "" })[0], /"title" is empty/);
  assert.match(bad({ title: "x".repeat(71) })[0], /"title" is 71 characters; a page takes at most 70/);
  assert.match(bad({ description: "x".repeat(171) })[0], /"description" is 171 characters/);
  assert.match(bad({ status: "draft" })[0], /"status" must be "live" or "archived"/);
  assert.match(bad({ blocks: [] })[0], /needs at least 1/);
  assert.match(bad({ blocks: Array.from({ length: 21 }, heroBlock) }).join("\n"), /takes at most 20/);
  assert.match(bad({ path: "/About" }, "About.json")[0], /must be \/, one lowercase word like \/about-us, or two like \/services\/glazing/);
  assert.match(bad({ path: "/a/b/c" }, "a--b--c.json", "/a/b/c")[0], /must be \/, one lowercase word like \/about-us, or two like \/services\/glazing/);
  assert.match(bad({ title: "Hi <script>" })[0], /"title" contains an HTML tag/);
});

test("menu rules", () => {
  const withMenu = (menu) => withoutRefusal(check(aboutWith([heroBlock()], { menu })));
  assert.deepEqual(withMenu({ label: "About", order: 1, places: ["header", "footer", "legal"] }), []);
  assert.match(withMenu({ label: "", order: 1, places: ["header"] })[0], /menu "label"/);
  assert.match(withMenu({ label: "x".repeat(25), order: 1, places: ["header"] })[0], /menu "label" is 25 characters/);
  assert.match(withMenu({ label: "A", order: 1.5, places: ["header"] })[0], /whole number/);
  assert.match(withMenu({ label: "A", order: 1, places: [] })[0], /at least one of/);
  assert.match(withMenu({ label: "A", order: 1, places: ["sidebar"] })[0], /not one of header, footer, legal/);
  assert.match(withMenu({ label: "A", order: 1, places: ["header"], colour: "red" })[0], /menu "colour" is not a menu field/);
});

test("at most six header pages; archived menu entries are ignored", () => {
  const pagesWithMenu = (n, status = "live") =>
    Array.from({ length: n }, (_, i) => ({ file: `p${i}.json`, data: page(`/p${i}`, [heroBlock()], { status, menu: { label: `P${i}`, order: i, places: ["header"] } }) }));
  const run = (n, status) => withoutRefusal(validatePages([home(), contact(), ...pagesWithMenu(n, status)], registry, repo));
  assert.deepEqual(run(6), []);
  assert.deepEqual(run(7), ["The header menu lists 7 pages; at most 6 fit. Remove some from the header or archive them."]);
  assert.deepEqual(run(9, "archived"), []);
});

test("validateContent works on one block", () => {
  const ctx = { repo, pages: null };
  assert.deepEqual(validateContent(hero, { title: "Hi" }, "x", ctx), []);
  assert.deepEqual(validateContent(hero, "nope", "x", ctx), ["x: the content must be an object."]);
  assert.deepEqual(validateContent(hero, { title: 5 }, "x", ctx), ['x: "title" must be text.']);
});

test("registry problems", () => {
  assert.deepEqual(validateRegistry(registry), []);
  const dup = validateRegistry([hero, { ...hero }]);
  assert.deepEqual(dup, ['block "hero" is defined twice; every block type needs its own name.']);
  assert.match(validateRegistry([hero, { ...hero, source: "site" }])[0], /a site block may not reuse the name of a library block/);
  assert.match(validateRegistry([{ ...hero, type: "Bad_Name" }])[0], /lowercase words joined by hyphens/);
  assert.match(validateRegistry([{ ...hero, variants: [] }])[0], /no variants/);
  assert.match(validateRegistry([{ ...hero, variants: [{ name: "a", description: "x" }, { name: "a", description: "y" }] }])[0], /"a" is listed twice/);
  assert.match(validateRegistry([{ ...hero, title: " " }])[0], /title is empty/);
  assert.match(validateRegistry([{ ...hero, description: "" }])[0], /description is empty/);
  assert.match(validateRegistry([{ ...hero, motion: { entrance: "none", reason: "too short" } }])[0], /at least 20 characters/);
  assert.deepEqual(validateRegistry([{ ...hero, motion: { entrance: "none", reason: "It is the first paint, so it never animates." } }]), []);
  assert.match(validateRegistry([{ ...hero, motion: { entrance: "default", signature: { keyframes: "", reason: "r" } } }])[0], /signature animation needs/);
  const badExample = validateRegistry([{ ...hero, example: { title: "x".repeat(200) } }]);
  assert.match(badExample[0], /block "hero", example: "title" is 200 characters.*must pass its own schema/);
  assert.match(validateRegistry([{ ...picture, example: { image: { src: "/images/a.jpg", alt: "photo" } } }])[0], /says nothing about the picture/);
});

test("generic alt words match the scope rules", () => {
  assert.deepEqual([...GENERIC_ALT_WORDS], [...rules.genericAltText]);
});

test("parseVideoUrl: YouTube", () => {
  const yt = (id) => ({ provider: "youtube", id });
  const id = "dQw4w9WgXcQ";
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/watch?v=${id}&t=30s`,
    `https://www.youtube.com/watch?feature=share&v=${id}&si=abc`,
    `https://youtu.be/${id}`,
    `https://youtu.be/${id}?si=abc&t=3`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://youtube-nocookie.com/embed/${id}?start=3`,
  ]) assert.deepEqual(parseVideoUrl(url), yt(id), url);
  assert.deepEqual(parseVideoUrl("https://www.youtube.com/watch?v=a_b-C1d2E3f"), yt("a_b-C1d2E3f"));
});

test("parseVideoUrl: Vimeo", () => {
  assert.deepEqual(parseVideoUrl("https://vimeo.com/76979871"), { provider: "vimeo", id: "76979871" });
  assert.deepEqual(parseVideoUrl("https://www.vimeo.com/76979871"), { provider: "vimeo", id: "76979871" });
  assert.deepEqual(parseVideoUrl("https://vimeo.com/76979871/abcdef0123"), { provider: "vimeo", id: "76979871", hash: "abcdef0123" });
  assert.deepEqual(parseVideoUrl("https://player.vimeo.com/video/76979871"), { provider: "vimeo", id: "76979871" });
  assert.deepEqual(parseVideoUrl("https://player.vimeo.com/video/76979871?h=abcdef0123&autoplay=1"), { provider: "vimeo", id: "76979871", hash: "abcdef0123" });
});

test("parseVideoUrl: rejects", () => {
  for (const url of [
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=dQw4w9WgXc",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQQ",
    "https://www.youtube.com/watch?v=dQw4w9WgX!Q",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/playlist?list=PL1234567890A",
    "https://www.youtube.com/embed/dQw4w9WgXcQ/extra",
    "https://youtu.be/dQw4w9WgXcQ/extra",
    "https://youtube-nocookie.com/watch?v=dQw4w9WgXcQ",
    "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://evil.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com@evil.com/watch?v=dQw4w9WgXcQ",
    "https://user:pw@www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com:8443/watch?v=dQw4w9WgXcQ",
    "https://vimeo.com/abc",
    "https://vimeo.com/76979871/notahash",
    "https://vimeo.com/76979871/abcdef0123/extra",
    "https://player.vimeo.com/video/76979871?h=zzzz",
    "https://player.vimeo.com/76979871",
    "https://example.com/video.mp4",
    "javascript:alert(1)",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ extra",
    "not a url",
    "",
    42,
    null,
  ]) assert.equal(parseVideoUrl(url), null, String(url));
});

test("embedUrl, watchUrl and origins", () => {
  const yt = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ?si=x");
  assert.equal(embedUrl(yt), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1");
  assert.equal(watchUrl(yt), "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const vm = parseVideoUrl("https://vimeo.com/76979871");
  assert.equal(embedUrl(vm), "https://player.vimeo.com/video/76979871?autoplay=1&dnt=1");
  assert.equal(watchUrl(vm), "https://vimeo.com/76979871");
  const vh = parseVideoUrl("https://vimeo.com/76979871/abcdef0123");
  assert.equal(embedUrl(vh), "https://player.vimeo.com/video/76979871?autoplay=1&dnt=1&h=abcdef0123");
  assert.equal(watchUrl(vh), "https://vimeo.com/76979871/abcdef0123");
  assert.deepEqual([...embedOrigins], ["https://www.youtube-nocookie.com", "https://player.vimeo.com"]);
  for (const provider of videoProviders) assert.notEqual(parseVideoUrl(provider.example), null, provider.name);
});

test("page files: read, sort, errors and live pages", () => {
  const root = mkdtempSync(join(tmpdir(), "pages-"));
  assert.deepEqual(readPageFiles(root), []);
  const dir = join(root, "src/content/pages");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "services.json"), JSON.stringify(page("/services", [heroBlock()], { status: "archived" })));
  writeFileSync(join(dir, "home.json"), JSON.stringify(page("/", [heroBlock()])));
  writeFileSync(join(dir, "about.json"), '{ "path": "/about", }');
  writeFileSync(join(dir, "empty.json"), "  ");
  writeFileSync(join(dir, "notes.txt"), "ignored");
  const files = readPageFiles(root);
  assert.deepEqual(files.map((f) => f.file), ["about.json", "empty.json", "home.json", "services.json"]);
  assert.match(files[0].error, /^is not valid JSON \(.*\)\. Look for a missing or extra comma/);
  assert.equal(files[0].data, undefined);
  assert.match(files[1].error, /^is empty/);
  assert.equal(files[2].error, undefined);
  assert.deepEqual(livePages(root).map((p) => p.path), ["/"]);
  assert.ok(validatePages(files, registry, repo).some((p) => p.startsWith("about.json: is not valid JSON")));
});

test("registry problems: the real registry has none", async () => {
  const { registry, libraryBlocks } = await import("../src/blocks/definitions.ts");
  assert.deepEqual(validateRegistry(registry), []);
  assert.deepEqual(
    libraryBlocks.map((def) => def.type),
    ["hero", "highlights", "prose", "faq", "closing-cta", "contact-form", "steps", "legal-sections", "video", "video-grid"],
  );
});

test("every library example validates", async () => {
  const { libraryBlocks } = await import("../src/blocks/definitions.ts");
  for (const def of libraryBlocks) {
    assert.equal(def.source, "library", def.type);
    assert.deepEqual(validateContent(def, def.example, `${def.type} example`, { repo, pages: null }), [], def.type);
    assert.ok(def.description.length > 20 && def.variants.every((v) => v.description.length > 0), `${def.type} describes itself`);
    const text = JSON.stringify(def.example);
    assert.ok(!text.includes("[["), `${def.type} example has no placeholder`);
    assert.ok(!/\$\d/.test(text), `${def.type} example has no price`);
  }
});

const thanksData = { after: { href: "/services" }, meanwhile: { links: [{ href: "/about" }, { href: "/services" }] } };

test("thanks links to an archived page fail", () => {
  const services = { file: "services.json", data: page("/services", [heroBlock()], { status: "archived" }) };
  const problems = validatePages([home(), contact(), aboutWith([heroBlock()]), services], registry, repo, { links: thanksPageLinks(thanksData) });
  assert.equal(problems.length, 2);
  assert.ok(problems[0].startsWith('contact.ts, thanks page "after" link: "/services" points to /services, which is archived'));
  assert.ok(problems[1].startsWith('contact.ts, thanks page link 2: "/services" points to /services, which is archived'));
});

test("a thanks link to a page whose file failed to parse gives the parse error only", () => {
  const broken = { file: "services.json", data: undefined, error: "is not valid JSON (Unexpected token). Look for a comma." };
  const problems = validatePages([home(), contact(), aboutWith([heroBlock()]), broken], registry, repo, { links: thanksPageLinks(thanksData) });
  assert.equal(problems.length, 1);
  assert.ok(problems[0].startsWith("services.json: is not valid JSON"));
});

test("thanks links to live pages pass", () => {
  const services = { file: "services.json", data: page("/services", [heroBlock()]) };
  const problems = validatePages([home(), contact(), aboutWith([heroBlock()]), services], registry, repo, { links: thanksPageLinks(thanksData) });
  assert.deepEqual(problems, []);
});
