# Change scope check and change report

Clients will ask for website changes in plain words, and an AI will make each change on its own branch. These two tools
judge the **files** a branch changed, not what anyone says they did. They are plain Node scripts with no new dependencies.

- **Change scope check** (`npm run check:scope`): sorts a change into tier 1 or tier 3, flags risky tier 1 changes, and
  enforces the image (type, size, hidden data, alt text) and placeholder rules.
- **Strip images** (`npm run strip:images`): removes hidden camera and location data from the images a branch adds or
  changes, so the image rules can pass.
- **Change report** (`npm run report:changes`): before and after screenshots of the pages a change touches, at phone and
  desktop width, with the scope result on top (which lists each image with its alt text).

The rules live in one file: [`scripts/change-scope-rules.mjs`](../scripts/change-scope-rules.mjs). Editing it is itself tier 3.

## The tiers

| Tier | What it is | What the check does |
| --- | --- | --- |
| **1** | Content: copy in `src/content/<name>.ts` (plain data only, see below), photos in `public/images/`, a brand-new page built from blocks the site already has, the page list (`src/lib/routes.ts`) and the menu (`src/content/nav.ts`) | Passes. Risky tier 1 changes are **flagged** (below) |
| **3** | Everything else: `worker/`, `public/_headers`, `wrangler.jsonc`, `site.config.ts`, `package.json` and the lockfile, `.github/`, `.claude/`, `src/components/`, and any other file | Fails (exit code 1) and lists each file with a plain reason |

(Tier 2, "ask first", is about a vague request and is handled by the agent, not by files, so the scope check does not know it.)

Three modules in `src/content/` are wiring, not copy, so they are tier 3: `site.ts`, `providers.ts` and `auto-reply.ts`. Files
with a dot in the name (`*.test.ts`, `*.d.ts`) and files in sub-folders are tier 3 too. Symbolic links, submodules and file
type changes are tier 3 at any path, and so is deleting `routes.ts` or `nav.ts`.

**Tier 1 `.ts` files must be plain data.** A content module runs at build time (and `contact-fields.ts` also runs inside the
contact Worker, which holds the email and Turnstile secrets), so "it only changes text" is not enough. The file is parsed
with the TypeScript parser (already a dev dependency) and must contain only: imports of sibling content modules or
type-only imports, type declarations, and `const` values built from literals, arrays and objects (spreads, `as const`,
`satisfies` and `+` between literals are fine; a stray `;` is fine). Calls, functions, classes, templates with `${}`, `process`,
`fetch`, `require`, `.constructor`, computed or `dangerouslySetInnerHTML`/`__proto__` keys, `using` declarations, syntax errors and any
other statement make it tier 3. A NUL byte does too.

A **new page** is tier 1 only when its file is exactly `src/app/(site)/<name>/page.tsx` (lowercase, one folder deep) and it
passes both a text check and the parser:

- imports only `next`, `@/lib/metadata`, content modules and components that **already exist** on the base branch (the
  parser reads real import and export statements, so spacing tricks do not hide one);
- calls `pageMetadata(`;
- contains none of `"use client"`, `dangerouslySetInnerHTML`, `<script`, `<iframe`, `fetch(`, `process.env`, `eval(`, `import(`;
- fits a strict **allowlist grammar**, not a list of banned words (a banned-word list can never be complete: a property name
  built at run time reaches the `Function` constructor without containing any banned word). A new page is JSX plus content
  values: only imports, `const` values, functions and type declarations at the top level; inside functions only `const` and
  `return`; expressions made of literals, **names declared or imported in the page** (so no ambient globals such as `Object`, `JSON` or `parseInt`),
  property access, indexing by a number, arrays and objects with fixed keys,
  `+ - && || ?? ===` style operators and `?:`; calls only to **imported or same-page helpers** and to `.map`, `.filter`,
  `.flatMap` (exactly one inline arrow function as the argument), `.slice` and `.join` (plain numbers or text) and `.concat`, never on an
  object literal; `import type` is the only way to import from `next`; destructuring may not pull out `constructor`, `prototype`, `call`, `apply`, `bind` or an array method name, and an object key may not be
  named like an array method (so a plain object cannot be turned into a way to call arbitrary functions); JSX tags only from a list of
  safe HTML tags or components the page imports; attribute values that are strings or plain expressions (a link attribute
  may not be built with `+` or a template); no spread attributes, no computed keys, no `new`, no templates with `${}`, no
  `async`, no `if` or loops, no assignment. The readable banned-word reasons (`require`, `process`, `globalThis`, `fetch`,
  `.constructor`, `<script>`, `<form>`, `javascript:` and so on) still come first, so the message names the problem;
- parses without a syntax error (the build uses a different parser, so a tolerated error could be read differently).

Editing an **existing** page file is tier 3. Deleting a page is tier 1 but flagged.

## Flagged for Grant (still passes, always reported)

Checked on lines added and removed, so changing or deleting a price is flagged too:

- a dollar amount (`$900`, `500 USD`, `12 dollars`);
- a contact detail or booking link: an email address, `mailto:` or `tel:`, a US-style or international phone number, or a
  link on a known scheduler host (Calendly, Cal.com and similar, with or without `https://`; the list is in the rules file);
- any new `https://` link (added lines only), or a `javascript:` or `data:` link;
- a removed page, a route removed from `src/lib/routes.ts`, or a new page that is not added to `src/lib/routes.ts`;
- any change to `src/content/privacy.ts` or `src/content/contact-fields.ts`;
- a change over **300 changed lines** or over **10 files**.

## Image rules (blocking on change branches)

For added or changed files under `public/images/`: `.jpg`, `.jpeg`, `.png` or `.webp` only, the file's first bytes must
match its extension (a renamed SVG fails), and at most **500 KB** (512,000 bytes). SVG is never allowed because it can
carry code. A file with `<script`, `<svg`, `<html` or `<iframe` inside it fails even when its first bytes are right. Deleted
images are not checked.

### Hidden camera and location data (blocking on change branches)

A phone photo usually carries the GPS position it was taken at, the phone's make and model and the time, and editing tools
add captions, authors and thumbnails. On a client's website that can show where someone lives or works. Every added or
changed image must be free of it, and the check fails with the exact fix: run `npm run strip:images`, then commit.

What `npm run strip:images` removes, without decoding or re-encoding the picture (the picture bytes are copied unchanged).
It works from an **allow-list**: only the kinds of segment or chunk a picture needs are kept, and each one must have exactly
the size and structure its format defines, so something cannot be kept because of its name and then carry text in its
payload. Anything else is dropped. A known kind with the wrong shape (a header with extra bytes, a corrupt colour profile,
extra bytes after the picture stream) makes the file "damaged", because dropping it would break the picture.

| Type | Removed | Kept (and checked) |
| --- | --- | --- |
| jpg | EXIF (camera, GPS, time), XMP, IPTC/Photoshop, comments, an embedded thumbnail, every other application, reserved or unknown segment, anything after the end of the picture | the picture's own tables and headers (exact sizes checked), the colour profile and a 12-byte Adobe colour marker; **one EXIF block holding only the rotation flag**, so a sideways phone photo still shows upright |
| png | text notes, XMP, EXIF, the last-changed timestamp, suggested palettes, unknown private chunks, anything after the end of the picture | the drawing and colour chunks (gamma, colour profile, transparency, physical size, animation), each with its exact size; the picture data must be one complete compressed stream |
| webp | EXIF and XMP chunks (and their flags), unknown chunks whatever their name, unused header bits and bytes, anything after the end of the picture | the header, colour profile, animation and picture chunks |

By default it handles the images that differ from the point where the branch split from `origin/main`, whether committed,
staged or not yet added. `--all` handles every image under `public/images/`; `--check` changes nothing and exits 1 if any
image still has hidden data. A damaged image is reported and left untouched. Symbolic links and other file types are
skipped (the scope check refuses them anyway). It is safe to run twice. The scope check uses the same code, so the two can
never disagree about what "clean" means. The report names what was found (for example "EXIF (camera and location data)")
but never prints the data itself.

### Alt text (blocking on change branches)

Every added or changed image must be used somewhere in `src/` with real alt text written out next to it, so a screen
reader says what the picture shows. The check finds each place a string equal to the image's address appears (for
`public/images/team/sam.jpg`, the string `"/images/team/sam.jpg"`), reading the files with the TypeScript parser, and
accepts only these two shapes:

```tsx
<img src="/images/team/sam.jpg" alt="Sam at the front desk" />   // img, next/image or any component
{ src: "/images/team/sam.jpg", alt: "Sam at the front desk" }    // in a content file: any key may hold the path, the key must be alt
```

It fails when the image is used nowhere, when a use has no `alt`, when the alt text is empty, a `[[placeholder]]`, a file
name or camera name (`IMG_1234`, `DSC00123`), a word that says nothing (`image`, `photo`, `picture`, `graphic`, `icon`, `logo`,
`alt text`, `todo`, `tbd`, `untitled`, `placeholder`, with or without "a", "the", "of" or a plural; the list is
`genericAltText` in the rules file), something too short to describe a picture (under 3 letters or digits after punctuation,
HTML entities such as `&nbsp;` and invisible characters are taken out), and when the alt text is not written out as
plain text (a variable, a function call, a template with `${}` or a spread of props cannot be checked). Alt text may be a
string, a template without `${}`, or two strings joined with `+`. Every use is checked, not just the first. An element with
`aria-hidden` (anything but `"false"`) or `role="presentation"`/`"none"` fails, because its alt text is never read, and an
object that spreads another object (`{ src, alt, ...more }`) fails, because the spread could replace the alt text. A `?:`
choice between two images in `src` is fine. The change
report lists each image with its alt text, so Grant can read it and judge whether it actually describes the picture.

A purely decorative image (one that should have empty alt text) cannot pass this check on purpose: it stops for Grant,
who decides how to mark it.

## Leftover placeholders (blocking on change branches)

Any new `[[placeholder]]` on a line the change **adds** in `src/content/` or `src/app/`. A placeholder that was already on a
line the change edited is not new (each added one cancels against a removed one with the same text), and the launch gate (`npm run check:placeholders`, which lists every placeholder in the repo) is unchanged.

## Running it

```bash
npm run check:scope
```

By default it compares `HEAD` with `origin/main`. Options: `--base <ref>`, `--head <ref>`, `--report-only` (print the
same report, always exit 0) and `--ci` (read GitHub's own variables: the base comes from `GITHUB_BASE_REF`, and it is
strict only when the pull request's branch starts with `change/`; outside a pull request it does nothing). Exit codes:
0 pass, 1 fail, 2 could not run.

```bash
npm run strip:images
```

Cleans the images this branch adds or changes (see "Hidden camera and location data"). Options: `--base <ref>` (default
`origin/main`), `--all`, `--check`. Exit codes: 0 done, 1 an image still has data (`--check`) or could not be read, 2 could
not run.

```bash
npm run build
npm run report:changes
```

Writes `change-report/report.md` and `change-report/<page>/{before,after}-{phone,desktop}.png` (the folder is git-ignored).
"After" is your `out/` build. "Before" is built for you in a temporary git worktree from the point the branch split from
`main` (`npm ci` and `npm run build`, a minute or two, removed afterwards); pass `--base-out <dir>` to reuse a build you
already have. It photographs only the pages the change touches, found by following imports from the changed files (a change
that reaches the shared layout, or that it cannot trace, photographs every page). Widths: phone 390 × 844, desktop 1440 × 900.
It needs Chromium from Playwright (already a dev dependency) and falls back to an installed Google Chrome.

It needs `npm ci` first, because the code check uses the `typescript` dev dependency.

Tests for both tools: `npm run test:scripts` (fake diffs, plus throwaway real git repositories in the temp folder; no network).

## In CI

The jobs `change-scope` and `change-report` in `.github/workflows/ci.yml` (copied in by hand, because Claude Code
cannot write workflows) run on pull requests. They are **not** required checks yet: per CLAUDE.md a new check becomes
required only after 5 clean runs and a deliberate-failure proof PR, and only after the ruleset is changed first.

The jobs already run everything described here (the hidden-data and alt text checks live inside `check-change-scope.mjs`,
and the script tests run with the `scripts/*.test.mjs` glob), so adding them needed no further workflow change.

## Using it in a client repo

Copy `scripts/change-scope-rules.mjs`, `scripts/change-scope-code.mjs`, `scripts/check-change-scope.mjs`, `scripts/change-report.mjs`,
`scripts/image-metadata.mjs`, `scripts/image-alt.mjs`, `scripts/strip-image-metadata.mjs`, `scripts/image-fixtures.mjs`, every `*.test.mjs` beside them,
`scripts/preview.mjs` and the four `package.json` scripts (`check:scope`, `report:changes`, `strip:images`, `test:scripts`) from the template. Adjust the rules file for that site: any
extra page-building file that should stay off limits, and the size limits. Name the agent's branches `change/<short-name>`.

## Known limits

- **Strict mode depends on the branch name.** `--ci` is strict only when the pull request's branch starts with `change/`. The
  check judges files, not claims, but it trusts the actor it guards to pick that branch name. Until the ruleset enforces it
  (for example CODEOWNERS on tier 3 paths, or a required check that needs an owner label), the agent's workflow must create
  `change/` branches itself and nobody should open a client change from another branch.
- **The code checks are static analysis, one layer among several.** They reject code in tier 1 files and in new pages by
  reading the parse tree, which is far harder to dodge than text search, but they cannot prove a file is harmless. The other
  layers are the required checks (including CodeQL), the preview Grant looks at, and the rule that Claude cannot merge.
- **Images are checked by their first bytes, their size and a scan for markup**, not decoded. A hostile file that is a valid
  image and also carries a hidden payload could still pass; the site's CSP and `nosniff` header limit what it could do.
- **Two places stay unchecked, because looking inside them means decoding the picture.** Text hidden *inside* the compressed
  picture data (appended inside a JPEG scan, a WebP picture chunk or a PNG's compressed stream) and the free-text fields
  inside a colour profile (the ICC profile in a JPEG, PNG or WebP) pass through. Neither is something a camera, a phone or
  an editor writes by accident, and the checks above are aimed at that: the location and camera data real devices write.
  Someone who sets out to smuggle text into the pixels or the profile is a different problem, and Grant's own look at the
  preview and the report is the layer for it.
- **Stripping removes the known places a file can hold data, not everything.** It does not touch the picture itself, so a
  visible street sign, a name tag, a screen or a blurred-but-readable face stays. It does not change a file's name (a name
  such as `home-at-12-oak-street.jpg` stays), and it keeps a colour profile and the rotation flag on purpose. A PNG's rotation
  flag (in its EXIF chunk) is dropped rather than kept; browsers rarely use it. A JPEG with several EXIF blocks keeps at most
  one rotation-only block. A file stripped of a flag it needed to look right would need to be re-encoded, which this tool
  never does.
- **Alt text is checked for being there and for saying something, not for being true.** `"A smiling woman"` passes for any
  photo. Grant reads the alt text in the change report. Only uses in `.ts` and `.tsx` files under `src/` count (an image used
  only as a CSS background has nowhere to hold alt text, so it fails as "not used"). A use whose alt text sits in a variable,
  or in another file than the one holding the path, fails and has to be written out beside the image. The path must be
  written exactly (`"/images/a.jpg"`), with no query string such as `?v=2`.
- **Any string equal to the image's path counts as a use, rendered or not.** A real `<img>` whose `src` is built from pieces
  (`"/images/" + name`) and has empty alt, next to an unused object that holds the right path and good alt text, would pass.
  That is deliberate cleverness, not a slip, so it is left to Grant's look at the report and the preview.
- **Marker-level parsing, not full decoding.** The three file readers walk a file's segments or chunks and refuse a file whose
  structure is damaged (a cut-short upload, a length that runs off the end). They do not check that the compressed picture
  inside is valid; the browser does that.
- **A new page could still hang or crash the build** (for example an endless recursion). That is a denial of service, not code
  execution; the CI timeout and the preview Grant looks at are what stop it.
- **A link built from text pieces** (`"java".concat("script:...")` in a `href`) is not caught by the check; React 19 refuses to render
  `javascript:` links, and browsers block `data:` navigation, which is what stops it.
- **Spelled-out prices** ("five hundred dollars") and other currencies are not flagged.
- **The report's "after" is whatever is in `out/`**; rebuild before running it.

## What this does not do

It does not read copy for banned wording or invented claims. That is a separate check. It checks that alt text exists and
says something, but it cannot tell whether the alt text describes the picture. It also cannot tell whether a changed sentence
is true. It only guarantees that a change stayed inside the allowed files.
