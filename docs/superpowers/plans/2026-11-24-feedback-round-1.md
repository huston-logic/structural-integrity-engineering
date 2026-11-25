# Feedback round 1: plan

Run type: site change run (PROCESS.md rules 5, 6, 8). One branch `feat/feedback-round-1`, one PR. Grant approved the
brief, so there was no brainstorming. Built inline on Sonnet with `superpowers:executing-plans`; a Haiku scout reads and
searches. Push after each task so the Cloudflare preview updates. `npm run dev` stays running (http://localhost:4821).
No auto-merge: Grant reviews the preview first. Never remove a test, weaken an assertion, lower a threshold or change a
required check.

Spec: Grant's feedback brief (the 9 numbered items). Sources of truth: `incoming/sie-site-assets/copy-deck.md`,
`docs/STYLE-GUIDE.md` (v3), `AGENTS.md`. Where the brief changes copy, the brief wins and the old deck line is listed
as "before" in the PR.

## Global constraints

- `npm run check:fast` before every commit; full `npm run check` once before the PR; `npm run test:a11y` and
  `npm run test:lighthouse` locally once at the end (the logo, photos and motion all touch them).
- No new dependencies. Raster icons are made with the Chromium Playwright already installed.
- Do not touch the items waiting on Dylan (brief item 7): footer legal name, the 48-hour and "a decade" claims, the four
  condition lines, residential and commercial FAQ answers, "we" versus "I", testimonials, project photos.
- Owner-only paths (`.github/workflows`, `.claude/*`) are not edited. `wrangler.jsonc` is edited (ask file: expect a
  prompt); it is generated from `site.config.ts`, so edit the config and run `npm run sync:config`.
- Never redraw or alter the logo mark; only place it on a backing.

## Task 1: Logo, favicon, apple icon (brief item 1)

- Copy `incoming/SIE-Dylan_Space.svg` to `public/brand/sie-logo.svg`; set `brand.logo` in `site.config.ts`.
- `Logo.tsx`: a snow hexagon badge (CSS `clip-path`, 6 points that follow the mark's own outline) with the mark inset to
  about 86%, then the business name as text. Keep the `Link` and `aria-label`. The image has empty alt (the label
  carries the name). Used by header and footer already. Both bars are dusk or dusk-deep, so snow on them gives 9:1+.
- Favicon: `src/app/icon.svg` becomes the same badge with the mark's paths copied unchanged. `src/app/apple-icon.png`
  (180x180, snow square with the mark) is rendered from the SVG with Playwright's Chromium by a scratch script.
- Update STYLE-GUIDE §6 and §7.1/7.26 (wordmark line).
- Check: screenshots at 1440 and 390; contrast figures recorded in the PR.

## Task 2: Logo click lands scrolled down (brief item 2)

- Use `superpowers:systematic-debugging`: reproduce in Playwright first, find the cause (suspects: Next's
  scroll-into-view of the first page element against the sticky header and the hero that slides up under it, the
  `tabIndex={-1}` on `main`, native smooth scroll on `html`), fix the cause, no workaround.
- Test first (red, then green): `tests/a11y/navigation.spec.ts`: from `/services` click the logo, expect `/` with
  `window.scrollY === 0`. Also check Services, About and Contact links and the footer links land at the top.

## Task 3: Colorado focus (brief item 3)

- Find every "Alaska" in copy, titles, descriptions, alt text, JSON-LD (`areaServed`), Worker, docs and README.
  Remove it, keeping exactly one mention: where licensing is listed ("licensed in Colorado and Alaska").
- `alaska-chugach.jpg` and its sized variants out; the Pikes Peak photo (`colorado-pikes-peak.jpg`) or a free
  Unsplash or Pexels photo in, with its source recorded the way the other photos are. Page addresses do not change.
- `site.config.ts` `regionLine` and `oneLiner` follow; the phone number stays (it is Dylan's number).

## Task 4: Privacy page (brief item 4)

- Check what the site actually does (form fields, Turnstile, Worker, Sheet, Resend, Cloudflare hosting, Cloudflare Web
  Analytics, cookies, third-party requests) and write short, plain text for every section in `src/content/privacy.ts`.
  Only claims the code backs. Include how to ask for deletion (email Dylan) and the date. The PR lists every line.

## Task 5: Motion on inner pages (brief item 5)

- Invoke `human-touch-design`. One orchestrated moment per page: a line-drawing overlay in the page hero in the home
  hero's style (`HeroDrawing`, `.hl-draw*`), plus the existing subtle `.reveal` on the contact band only where the
  style guide allows. No effect on every block. Reduced motion and no-JS show the finished drawing; CLS stays 0.
- Update STYLE-GUIDE §9 for the new rule.

## Task 6: Earlier review items (brief item 6)

- Replace `storefront-dusk.jpg` (shows other brands' logos) with a free Unsplash or Pexels photo, source recorded.
- Services accordion heading "Questions" becomes "Glazing questions".
- Page titles over 60 characters (services, residential, about) shortened in `src/content/seo.ts`.
- Write in the site's voice: form error messages, the automatic reply's greeting and sign-off, the 404 message. Listed
  in the PR for approval.
- Rate limiter ids 2201 (production) and 2202 (preview) in `site.config.ts`, then `npm run sync:config`.

## Task 7: Review and critique (brief item 8)

- review-code, review-a11y, review-security once each on the whole branch; design critique from screenshots at 1440
  and 390 (design:design-critique if installed, otherwise human-touch-design in audit mode). Fix what they find.

## Task 8: Close (brief item 9)

- `npm run check`, `test:a11y`, `test:lighthouse`. `docs/STATUS.md` gets this round and its timing table (Needs Grant
  keeps the Dylan items). Open the PR: "Needs your eyes" line first, every copy change as before and after, the
  preview link. Do not enable auto-merge.

## Rulings

Recorded in the PR description and in `docs/STATUS.md` ("Last run").
