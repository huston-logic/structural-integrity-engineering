# Where this site differs from the template

This site is built from `huston-logic/site-template`. Its addresses match Dylan's old Wix site, its design is "option G,
Dusk", and it has a Services submenu. So a few things are not what the template has. Each one is small and lives in one
place. When a later template update is brought in, re-apply what this page lists (the template files are overwritten,
the lines below are not). Both D1 and D2 are candidates to bring back to the template first.

## D1. The contact page is /contact-us

- **What:** the contact page is `/contact-us` and its thanks page `/contact-us/thanks` (the template uses `/contact` and
  `/contact/thanks`).
- **Why:** these are the addresses of the old site, so no link breaks.
- **Where:** `CONTACT_PATH` and `THANKS_PATH` in `src/blocks/schema.ts` (the one place; the file stays import-free).
  Everything else reads them: `REQUIRED_LIVE`, `RESERVED_PATHS`, the link check in `src/blocks/validate.ts`,
  `noindexRoutes` in `src/lib/routes.ts`, the booking link in `src/blocks/links.ts`, the closing-cta example, the
  catalog text, `SCHEDULER_FALLBACK_HREF` in `src/content/site.ts`, and the tests. The thanks page route is
  `src/app/(site)/contact-us/thanks/page.tsx`, and the contact page file is `src/content/pages/contact-us.json`.
- **Re-apply on a port:** after copying the template's files, set the two constants again and grep for `/contact`.

## D2. Page paths can be two levels

- **What:** `/services/residential-structural-design` and its two siblings are page files. A `/` in a path is `--` in
  the file name: `services--residential-structural-design.json`. A slug never contains `--`, so the mapping is exact.
  The page route is a catch-all, `src/app/(site)/[...slug]/page.tsx`.
- **Why:** the old site's service pages sit under `/services/`.
- **Where:** `pathForFile` and `fileForPath` in `src/blocks/schema.ts`; `PATH_RE` and its error text in
  `src/blocks/validate.ts`; `rules.pageFile` and its message in `scripts/change-scope-rules.mjs`; the page-rules text in
  `scripts/blocks-catalog.mjs`; the route above. `slugForRoute` in `scripts/change-report.mjs` already turns `/` into `-`.
  Tests: `scripts/check-content.test.mjs`, `check-change-scope.test.mjs`, `change-report.test.mjs`.
- **Re-apply on a port:** the five places above.

## D3. The menu stays in nav.ts

- **What:** the header and footer menu come from `src/content/nav.ts`, not from the page files' `menu` entries. Page
  files here have no `menu`. `Header.tsx`, `HeaderNav.tsx` and `Footer.tsx` are the site's own.
- **Why:** the template's menu model (header, footer, legal) cannot say that Services has three sub-pages.
- **Re-apply on a port:** do not take the template's versions of those three files or of `nav.ts`.

## D4. Site blocks, bands and no glows

- **Site blocks.** Nearly every section is a site block (`src/site-blocks/`, 20 of them). Each is a thin adapter over a
  section component in `src/components/hl/`, which carries its own band color and spacing. Their definitions use
  placement `rhythm: "none"` (added to `src/blocks/rhythm.ts` and `Placement` in `src/blocks/schema.ts`), and motion
  entrance `none` (`src/site-blocks/motion.ts`), because the sections have their own CSS reveals. Their copy is in the
  page files. Photo sizes and phone copies come from `src/content/photos.ts` through `src/lib/photo-files.ts`.
- **No glows.** Dusk has none. `BlockView` in `src/blocks/BlockRenderer.tsx` renders no glow and its wrapper is not
  `relative`, so blocks paint in the same order as before the pages were blocks (a positioned wrapper changed the
  anti-aliasing of the sticky photos on the service pages). `Glow.tsx` stays for the video poster.
- **Library blocks read Dusk.** In `src/app/hl.css` (`@theme inline` and `@theme`) the template's names map to Dusk roles:
  `ink` is `night` (dark fill), `ink-2` is `mist` (muted text), `green` is `amber` (accent), `silver` and `white` are
  `snow`, `font-ui` is the one typeface, `rounded-btn` is a pill, `rounded-card` is square (photography stays square).
  The library's type steps (`text-list`, `text-blurb`, `text-item`, `text-card-title`, `text-subhead`) and measures
  (`max-w-intro`, `max-w-narrow`, `max-w-heading`) are set to sizes near the site's own scale. Nothing else in the
  library blocks was changed. `HeroContent` in `PageHero.tsx` is the site's hero text for the library hero block.
  On Dusk the library blocks read as plain dusk sections; none is used on a real page (they are in `/blocks` only).
- **Two forms on the showcase.** `ContactForm` takes an optional `name`; the contact-page block passes its own name when it is not the page's first block, so `/blocks` (which also shows the library's contact-form block) has no duplicate landmark.
- **`@booking`:** `src/blocks/links.ts` falls back to `CONTACT_PATH` when the site has no booking link
  (`bookCallHref()` can be null here).
- **Re-apply on a port:** the `none` entry in `rhythm.ts`, the `BlockView` wrapper, the `hl.css` mapping block, `links.ts`.

## D5. Not ported: thanks page link check

The template checks the links on its thanks page against archived pages (`thanksPageLinks`). This site's thanks page
links only to `/`, which must always be live, so `src/lib/pages.ts` and `scripts/check-content.mjs` do not pass those
links. `src/lib/thanks-links.ts` is kept as the template has it, and the template's tests of it pass.

## D6. Tokens, motion and the screenshot tool

- **Tokens only.** The primitives took their widths, spacing and sizes from brackets such as `max-w-[22em]` and
  `py-[104px]`. `npm run check:design` forbids that, so they are theme tokens now (`max-w-em-22`, `py-26`, `split:`
  for the 900 px breakpoint, `text-label`, and a few `@utility` rules in `hl.css`). Every value keeps its pixels.
- **The line drawings.** The check allows keyframes to animate only opacity and transform, and style props are forbidden.
  The lines of the drawings (`.hl-draw`) are now drawn by a transition of `stroke-dashoffset` from `@starting-style` instead of a
  `hl-draw` keyframe, and each element's delay is a `draw-at-N` class (N in hundredths of a second, listed for Tailwind
  with `@source inline`) instead of an inline style. The finished drawing and the timing are the same; a browser without
  `@starting-style` shows the finished drawing. The blocks declare no `signature`, which names a keyframe.
- **Screenshot tool.** `scripts/change-report.mjs` launches Chromium in software rendering and decodes every photo
  before the shot. With the GPU, two shots of the same build differed by up to 47 of 255 in places, so the pixel gate could
  not say "identical" for this site. Bring this back to the template.

## D7. A page file cannot have a `menu`

- **What:** the template's page files may carry a `menu` entry (label, order, places). On this site the menu is
  `src/content/nav.ts` (D3), so a `menu` on a page file would do nothing and look as if it worked. The validator
  (`validatePages` in `src/blocks/validate.ts`) now refuses it, with `MENU_REFUSED`: "The menu on this site is set by
  Huston Logic, so remove "menu" from this page." The site editor runs the same validator, so a chat change that sets a
  menu comes back as a problem in the change list, and nothing is changed. The existing menu shape checks still run.
- **Why:** the owner must not be told a page is in the menu when it is not.
- **Where:** `MENU_REFUSED` and the line that uses it in `src/blocks/validate.ts`; the "Change the menu" item in Lane 3 of
  `docs/EDITING-LANES.md`; tests in `scripts/check-content.test.mjs` and `worker/editor/site-differences.test.ts`. The
  editor's own code and tools still mention menus (`worker/editor/change-list.ts`, `read-tools.ts`, `tool-schemas.ts`);
  they were left as the template has them, so their wording is wrong for this site only for a menu that is refused anyway.
  The editor's test pages (`worker/editor/test-support.ts`) and the scope-check fixtures have no `menu`.
- **Re-apply on a port:** the refusal in `validate.ts`; keep `menu` out of this site's page files and test fixtures.

## D8. The owner page wears Dusk

- **What:** the owner page and sign-in page (`worker/editor/owner-page.ts`) take ten colors named for the template's
  palette (`white`, `ink`, `green` ...). This site's palette is Dusk, so `worker/editor/theme.ts` (`ownerTheme`) maps
  Dusk onto those ten roles; `worker/index.ts` and `tests/a11y/owner-page.spec.ts` call it. Dusk has no red that reads on
  a light page, so the warning color is left empty and the page uses its own dark rust.
- **Re-apply on a port:** keep `theme.ts` and its two callers; do not pass `siteConfig.theme.colors` straight in.

## D9. The site editor is off, and its factory checks no thanks links

- `editor.enabled` is `false` in `site.config.ts`, with no owner email, Access team, GitHub App id, KV id or workers.dev
  subdomain. `editor.github.owner` and `.repo` name this repo. `editor.rateLimitId` is `2203`, reserved in
  `docs/HOSTING.md`; no binding uses it until the editor is on.
- `worker/editor/factory.ts` passes no thanks-page links to the validator (see D5), and so does not import
  `src/content/contact.ts`, which imports `site.ts`; the Worker must never import `site.ts`.
- The editor's test fixtures use `CONTACT_PATH` and `fileForPath` (D1, D2); `worker/editor/site-differences.test.ts` tests
  reading and proposing a change to a two-level page.

## D10. Site-block images have a shape, and the photo blocks read Dusk

- **What:** the template's image fields now name a crop shape (`shape: "3:2"` ...). The site blocks show fixed site photos
  (sizes from `src/content/photos.ts`), not cropped ones, so each site block's image field names the shape its photos
  already have (3:2 for the service and photo heroes and the wide About photo; 4:5 for the home hero, the service cards
  and What we do, whose pair of photos is trimmed to 4:5 while a single photo shows at 4:3, which the field's help says).
  The About portrait is shown whole, not trimmed; its field says 4:5, the nearest shape (the photo is 3:4), and its help
  says so.
  The shape only feeds the catalog and the editor's "will be trimmed" note. A `focus` on a site block's photo is accepted
  and ignored. An uploaded photo (`/images/uploads/...`) is not in `photos.ts`, so a site block cannot show one yet; the
  library blocks (photo-text, gallery, highlights, video) can. Uploads are off on this site.
- **Dusk:** `Photo` and the PDF link pill use `bg-tint` and `text-tag`. In the library block of `src/app/hl.css`,
  `tint` is `dusk-deep` and `text-tag` is 13 px.
- **Re-apply on a port:** the `shape` on each site block's image field; the two lines in `hl.css`; `CONTACT_PATH` and no
  `menu` in the upload tests' fixtures (`uploads-acceptance.test.ts`, `owner-uploads.test.ts`); `pages.ts` and
  `check-content.mjs` pass no thanks-page links (D5).

## D11. Brand stays fixed (no brand.json)

- **What:** the template moved colors, fonts and the logo to `src/content/brand.json` so the owner can change them by chat.
  Here they stay as they were: `theme.colors`, `theme.fonts` and `brand.logo` in `site.config.ts`, with `npm run sync:config`
  still writing the `:root` palette in `src/app/hl.css` and `src/lib/fonts.ts` from them. There is no `brand.json`, no
  `src/app/palette.css`, and no editor tool can change a color, a font or the logo.
- **Why:** the template's brand settings need its 13 color names and its curated fonts (Manrope is allowed for headings only),
  and its logo is an uploaded raster image. This site has the 8 Dusk colors, one typeface and an SVG mark, so moving them
  would change every page. The rule is "no visible change to any page".
- **One switch:** `BRAND_FIXED` in `src/settings/names.ts` (import-free, so the build, the scripts and the Worker read it). It
  gives `SITE_SETTINGS_NAMES` (`business` and `notice`: the settings files this site has), the empty
  `GENERATED_BRAND_FILES` (`src/brand/generated.ts`), and the one message `BRAND_FIXED_MESSAGE`: "On this site the colors,
  fonts and logo are set by Huston Logic, so they cannot be changed here. Ask Huston Logic."
- **Where it acts:** `validateSite` (`src/collections/site-validate.ts`) skips brand and refuses a `brand.json` that appears;
  the editor (`worker/editor/operations.ts`) refuses `set_brand_color`, `set_font` and any `set`, `insert_item` or
  `remove_item` on the brand settings with that message, `get_settings` for brand and `list_collections`
  (`worker/editor/read-tools.ts`) say it, the editor's instructions item 15 tells the AI not to propose it,
  `worker/editor/site-reader.ts` never reads or commits `brand.json`, `palette.css` or `fonts.ts`; the scope rules
  (`scripts/change-scope-rules.mjs`) have no brand file, so those three are tier 3; the catalog says brand is fixed
  (`buildSettings` in `scripts/blocks-catalog.mjs`). `docs/EDITING-LANES.md` puts brand colors, fonts and the logo in Lane 3.
- **Kept as the template has them (so a later port stays easy):** `src/brand/`, `src/settings/brand.ts` and their tests, run
  on the template's own default brand in `src/brand/fixtures/template-brand.json` (used by tests only, never by the site);
  the generators in `scripts/config-rules.mjs` (`brandFiles`, `driftedFiles`).
- **The OG image route and the layout's `themeColor` keep this site's versions** (they read `theme.colors`). `Logo.tsx` keeps
  the drawn mark and takes only the business name from `business.json`.
- **Re-apply on a port:** `BRAND_FIXED` and what reads it (the files named above); `scripts/sync-config.mjs` is this site's own
  (no `brandFiles`), `scripts/make-example-photos.mjs` reads `theme`, `scripts/check-placeholders.mjs` keeps the `theme` keys;
  do not take the template's `hl.css` palette removal, its `color-mix` shadows and glows, `Logo.tsx`, `og.png/route.tsx`
  or `layout.tsx`. To bring brand settings in later: set `BRAND_FIXED` false, add a real `brand.json` in the template's shape,
  switch `sync-config.mjs` to the template's, and write the tests that now say "fixed" the other way.

## D12. The example items and the blog page are archived

- **What:** the template ships `src/content/pages/blog.json` and one example item per kind (post, video, episode, testimonial,
  team member) as `live` with `[[placeholders]]`. Here every one has `"status": "archived"` and `blog.json` has no `menu` (D7).
  Nothing is deleted; an owner can restore them by chat. The example post's link goes to `CONTACT_PATH` (D1).
- **Why:** live, they would put a `/blog` page, an example post and a feed full of placeholders on Dylan's site.
- **Nothing under `/blog` is built.** The blog route (`src/app/(site)/blog/[[...path]]/page.tsx`) must generate at least one
  address for a static export, so with `blog.json` archived it generates `/blog` and Next writes a 404 shell there and an
  empty `/blog/feed.xml`. `scripts/finish-build.mjs` removes `blog.html`, `blog.txt` and `blog/` from `out/` after the build
  when no live page has the path `/blog`. `src/lib/routes.ts` already leaves an archived page out of the sitemap, the a11y
  scan and Lighthouse. The validator does not force `/blog` live: it asks for a live `/blog` only when a post is live.
  Residue: each page's embedded route tree (`"s":["blocks","blog",...]`, invisible) names `blog` as a route.
- **Tests:** `scripts/finish-build.test.mjs`, `src/lib/routes.test.ts`, `src/lib/seo.test.ts` (live pages only),
  `src/collections/validate.test.ts` (the shipped examples are `archived`), and the editor's `test-support.ts` seeds the examples
  as `live` (`asShipped`) so the template's tests keep exercising the same states.
- **To restore:** set `blog.json` to `live` (and add `menu` links in `nav.ts` if wanted), and the posts that are ready to `live`.

## D13. Business details are in `src/content/business.json`

- **What:** the public phone number, public email, address, hours and social links moved out of `site.config.ts`
  (`owner.phone` and `contact.linkedInUrl` are gone) to `src/content/business.json`, values copied exactly: name "Structural
  Integrity Engineering", phone "(907) 350-3456", email "dylan@structural-integrity-engineering.com", no address, no hours,
  no social links (there was no LinkedIn page). `contact.siteEmail` stays in `site.config.ts` (where notifications go).
  `business.timeZone` is "America/Denver". `src/content/notice.json` is `{ "text": "", "endsOn": null }`: no notice, and the
  `Notice` component (in `SiteChrome`) renders nothing for it.
- **Who reads it:** the footer, the contact page hero and band, the steps block's email line, the contact form's error line
  (the server blocks pass it in as `direct`), the logo's text and label, `og:site_name` and the OG alt, and the homepage
  JSON-LD name and email. `src/lib/direct-contact.ts` is the one reader for phone and email; it keeps this site's
  `telHref` (`tel:+1...`), not the template's digits-only one, so the links do not change.
- **Wiring colors:** `contact.emailColors` (the auto-reply) holds the Dusk values the email always used, and
  `editor.pageColors` holds `ownerTheme(theme.colors)` (D8); `worker/editor/theme.test.ts` keeps the two equal.
- **Re-apply on a port:** `directContact()` in the footer, contact hero and band, steps block and the contact blocks; `Logo.tsx`
  and `Footer.tsx` stay this site's; the Worker's auto-reply reads `contact.emailColors`, with no `schedulerUrl`.
