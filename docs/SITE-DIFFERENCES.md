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
