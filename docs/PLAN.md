# Autonomous run plan (approved 2026-11-23)

The task list for the autonomous run described in CLAUDE.md, "Autonomous runs": build the complete new website for
Structural Integrity Engineering (Dylan Gassmann, structural engineer, Colorado and Alaska). Progress is tracked in
`docs/STATUS.md`. One PR per task, in order; each later task branches from `main` after the earlier PR merges,
because it builds on it.

## Inputs

All in the git-ignored folder `incoming/sie-site-assets/`. Never commit it.

- `copy-deck.md`: every word on the site, page by page, plus page addresses, photo placement, credits and open items.
  Exported on 2026-11-23 from Grant's Claude Doc "Structural Integrity Engineering: site copy deck" (rev 8). Use only
  this copy. Never invent copy, claims, prices or numbers; anything missing becomes a `[[placeholder]]`.
- `option-g-dusk-reference.html`: the approved home page ("option G, Dusk"). Match it closely: palette (sky teal
  `#1C4A50`, deep teal `#163A40`, text `#EEF4F4`, muted `#C2D6D8`, amber accent `#F2B266`), Manrope as the one
  typeface, the centered hero headline in the photo's sky, the amber line drawing that draws itself over the house
  (SVG coordinates are in the photo's own pixels, viewBox `0 0 2000 2499`; keep `dusk-home.jpg` at that aspect ratio so
  they stay aligned), the four design-condition glyphs, photo cards, count-up numbers, CSS-only scroll reveals, and its
  phone layout. Every other page uses the same system and must feel like the same studio made it.
- `photos/`: 15 photos, named as in `copy-deck.md`.
- Quality bar: a 2026 premium architecture or engineering studio. Generous space, big confident type, real
  photography, restrained palette, motion only where it helps. Nothing cramped, nothing that reads as a template.
  The design tasks use the repo's `human-touch-design` skill.

## Models

The orchestrator names a model on every dispatch:

- `opus`: tasks 3 and 5 (design system, home page), task 12 (visual review), and any fix loop that reaches round 4.
- `sonnet`: tasks 2, 7, 8, 9, 10, 11, and code reviews of design or Worker changes.
- `haiku`: tasks 1, 4 and 6, and reviews of config-only or docs-only changes.

## Tasks

1. **Client config.** `site.config.ts`: business name "Structural Integrity Engineering", legalName "Structural
   Integrity Engineering, Inc.", tagline "Strength you can build on.", oneLiner = the home hero line; owner Dylan
   Gassmann, Principal Engineer, (907) 350-3456, region "Colorado and Alaska"; domain
   `https://structural-integrity-engineering.com`, workerName `structural-integrity-engineering`; siteEmail
   `dylan@structural-integrity-engineering.com`, fromName "Structural Integrity Engineering website", replyFromName
   "Dylan Gassmann"; rate-limit namespace ids "1001" and "1002". Leave `turnstileSiteKey` null (queued). Run
   `sync:config`. Replace the template identity in README.md, the `package.json` description and the AGENTS.md
   business rules (keep every pipeline rule).
2. **No booking link, no LinkedIn.** Dylan has neither. Make `"none"` an explicit, allowed value for
   `contact.schedulerUrl` and `contact.linkedInUrl`: `check:placeholders` passes with it, pages simply omit them, and
   the automatic reply works without a booking link. Update the Worker and its tests. Flag it as a change to bring back
   to site-template.
3. **Design system from option G.** Theme colors and Manrope through the template's existing config and generators;
   buttons, links, header and menu (Services with its three pages, About, Contact, a Request a quote button; works by
   keyboard and on a phone), footer, the shared contact band, focus styles, reduced motion. No new dependencies unless
   unavoidable (then the dependency rules apply; flag it).
4. **Photos.** `strip:images` on all 15, then resize and compress with macOS `sips` (built in): about 2400 px wide for
   full-width heroes (`dusk-home.jpg` stays 2000 x 2499), about 1200 px for cards, each under about 350 KB where
   possible, into `public/images/`. Alt text describing each photo. `docs/PHOTO-CREDITS.md` from the copy deck (credits
   stay off the pages).
5. **Home page**, exactly per `copy-deck.md` and the reference: hero with the overlay, Built for every condition, What
   we design cards, numbers (48, 10, 2: the real numbers are in the HTML for screen readers and with JavaScript off, and
   show final values under reduced motion), Why builders call us back, contact band.
6. **Routes.** Keep the old Wix addresses exactly: `/services`, `/services/residential-structural-design`,
   `/services/low-rise-commercial-structural-design`, `/services/glazing-and-mullion-engineering`, `/about-us`,
   `/contact-us`, `/contact-us/thanks` (noindex), `/privacy`. Update `src/lib/routes.ts`, the sitemap, the menu and
   every internal link; remove `/about` and `/contact`.
7. **Services page** (`/services`): every section in the copy deck, the six numbered steps, the glazing questions as an
   accordion.
8. **The three service pages:** one shared layout (hero photo, overview, what we do with its secondary photos, what you
   get, a short "How we work" linking to `/services`, contact band).
9. **About page:** hero, what we are, Dylan with his portrait, the Alaska and Colorado photo pair, mission.
10. **Contact:** the six required fields from the copy deck, end to end: `contact-fields.ts`, validation, the Worker and
    its tests, the Sheet columns and `docs/apps-script`, the thanks page text. The form still posts to `/api/contact`.
    No live email, no real secrets.
11. **SEO and finish:** a unique title and meta description per page (only from `copy-deck.md`, under 155 characters),
    an OG image in the new style, Organization JSON-LD from config, a 404 page in the new style, and the privacy page
    updated with the business name and contact, marked for Grant to review.
12. **Visual review and polish (opus):** build, run `test:a11y` and `test:lighthouse` locally if Chromium is already
    installed (do not install it), screenshot every page at 390 px and 1440 px with the existing Playwright setup, and
    compare each against the reference and the quality bar. Fix anything cramped, misaligned, off-palette,
    generic-looking or broken on a phone, in one polish PR. List the screenshot paths in the summary.

## Every PR

`superpowers:requesting-code-review` before enabling auto-merge, `superpowers:verification-before-completion` before
calling a task done, `superpowers:systematic-debugging` on any CI failure. Check code scanning results on each PR, not
only the CI jobs. Never weaken a test, threshold or axe rule. No questions to Grant: make the call, record it, keep
going.

## Stop list

Queue the item and continue with other tasks on: Cloudflare connection and preview links, Turnstile keys, Resend, every
Worker secret, the Google Sheet, DNS, secrets or credentials, accounts or money, sending real email, deleting user data,
lowering any threshold or required check, or any owner-only path (`.claude/hooks|agents|skills|settings*.json`,
`.github/workflows`). For owner-only changes, write `<file>.proposed` to the scratchpad and list it, plus one hand-copy
batch script.

New dependencies: exact-pinned, at least 7 days old (`npm view <pkg> time`), and `dependency-review` must pass. Flag
them in the summary.

## End of run

Post one summary: every PR with its link and merge state, the "Rulings I made" list, flags (dependencies, copy
questions, items to bring back to site-template), the stop queue, the hand-copy batch, the screenshot paths, and the
three things Grant should look at first. Update `docs/STATUS.md`.
