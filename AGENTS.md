<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# [[CLIENT_NAME]] website: permanent rules

Website for [[CLIENT_NAME]] ([[ONE_LINE_DESCRIPTION]]). Next.js App Router, strict TypeScript, Tailwind CSS v4, **static export** deployed on **Cloudflare Workers**. Merging a pull request into `main` deploys automatically through Cloudflare Workers Builds; other branches get preview URLs. Never run `wrangler deploy` by hand. Read this file before changing the repo, and update it when a rule changes.

## Sources of truth

- **Copy:** `docs/website-plan.md` (Revision 7.1), **Section B** only. It is the single source of every visible string. Preserve it verbatim.
- **Design:** `docs/STYLE-GUIDE.md` (style guide v3), including its approved first-screen spec. The logo files are in `public/brand/`; never redraw the mark. Where this file and those two disagree on copy or design, they win.
- **Pricing:** the site publishes one price, "from `[[$750]]`" for a website. The Workflow Review fee stays unpublished.
- **Contact form:** `src/components/hl/ContactForm.tsx` posts JSON to the contact Worker (`POST /api/contact`, `worker/contact.ts`, website-plan E6), which verifies Turnstile, appends a row to [[OWNER_NAME]]'s Google Sheet (through a Google Apps Script web app by default, or a service account; `contact.sheetWriter` in `site.config.ts`), emails [[OWNER_NAME]] and sends the B7b automatic reply. The form shows success (by moving to `/contact/thanks`) only when the Worker says the note reached [[OWNER_NAME]]; there is no fake success state, and answers never go in the URL (the thanks page gets the first name from `sessionStorage`). Without JavaScript nothing is sent (no `action`, `method="post"`). See the README's "Contact form" section.

## Architecture

- `output: "export"` in `next.config.ts`. The Next.js site is 100% static: no API routes, no server actions, no runtime server code, no `next/image` optimization (images are `unoptimized`; ship pre-sized files). Server-side needs go to an external provider (scheduler, analytics) or, for the contact form, the Worker.
- `worker/` is the only server code: the contact Worker, run by `wrangler.jsonc` for `/api/*` only (`run_worker_first`), with its own `tsconfig.json`, generated runtime types (`npx wrangler types worker/worker-configuration.d.ts`; regenerate after changing `wrangler.jsonc`) and tests on Node's built-in runner (`worker/*.test.ts`, mocked `fetch`, never real mail or data). It uses no libraries: `fetch` for Turnstile, Resend and the Sheet writer, and Web Crypto for the service-account JWT. The Sheet writer is chosen by `contact.sheetWriter` in `site.config.ts`: `apps-script` (the default; `worker/apps-script.ts` posts `{ secret, tab, row }` to the Apps Script in `docs/apps-script/contact-sheet.gs`) or `service-account` (`worker/sheets.ts`). **The Worker reads every client-specific value (names, email, booking link, Worker name, Sheet tabs, writer, signature colors) from `site.config.ts` through `worker/config.ts`; no client literal belongs in `worker/` or `content/auto-reply.ts`, and the tests build the Worker from a fixture config (`createWorker`) with obviously fake values.** It may import only import-free modules from `src/` and the import-free `site.config.ts` (`content/contact-fields.ts`, `content/auto-reply.ts`, `content/providers.ts`, `lib/contact-validation.ts`, `lib/first-name.ts`), with explicit `.ts` extensions, so the form and the Worker share one set of rules. Never import `site.ts` there (it reads `process.env`). While `contact.siteEmail` or `contact.schedulerUrl` is `null`, the Worker refuses to send (502, `config_incomplete`). The notification email is plain text only; the automatic reply is the one HTML email, a fixed template in which the only visitor input is the escaped first name, and its logs hold fixed event names and status codes, never personal data or secrets.
- `src/app/` routes only: pages, `layout.tsx`, `sitemap.ts`, `robots.ts`, `not-found.tsx`, `og.png/route.tsx`, `icon.svg`. Route files compose components and content; they hold no copy. Every site page lives in the `(site)` route group, whose layout adds the header, `main#main` and footer (`SiteChrome`; the 404 wraps itself in it too).
- `src/content/` holds **all copy and site settings** as typed TypeScript modules (`home.ts`, `services.ts`, `about.ts`, `contact.ts`, `contact-fields.ts`, `auto-reply.ts`, `privacy.ts`, `site.ts`, `providers.ts`, `nav.ts`). Edit copy here, never inline in JSX. Provider settings (`email`, `schedulerUrl`, `linkedInUrl`, `turnstileSiteKey`) are set in `site.config.ts` (`contact.*`); `providers.ts` re-exports them and `site.ts` re-exports those.
- `src/components/hl/` the v3 design primitives and page sections; `src/components/layout/` header, footer and nav; `src/components/ui/` copy helpers (`Text`, `Placeholder`, `JsonLd`, `BookCallButton`). Prefer a new small reusable component over repeating markup. Server Components by default; add `"use client"` only for real interactivity (currently: `HeaderNav`, `ContactForm`, `ThanksText`). Keep client JS minimal.
- `src/lib/` pure helpers (`metadata.ts`, `organization-jsonld.ts`, `site-organization.ts`, `serialize-jsonld.ts`, `placeholders.ts`, `fonts.ts`, `routes.ts`, `contact-validation.ts`, `first-name.ts`, `contact-handoff.ts`).
- `scripts/` Node scripts: `check-placeholders.mjs` (launch gate), `preview.mjs` (static preview server that also applies the `/*` block of `public/_headers`), `check-redirects.mjs` (checks that old-site URLs listed in a file 301 to a 200 page on a given base URL; tests in `check-redirects.test.mjs`), `change-scope-rules.mjs` (the one tier allow-list for client changes), `change-scope-code.mjs` (parser checks that tier 1 `.ts` files are plain data and new pages use only what the site has), `check-change-scope.mjs` (`npm run check:scope`: judges the files a branch changed against that allow-list; strict on `change/*` branches), `change-report.mjs` (`npm run report:changes`: before and after screenshots of the pages a change touches), `image-metadata.mjs` (removes hidden camera and location data from jpg, png and webp without re-encoding), `strip-image-metadata.mjs` (`npm run strip:images`: cleans the images a branch adds or changes under `public/images/`) and `image-alt.mjs` (finds the alt text next to every use of an image); `image-fixtures.mjs` is test support only. All scripts have tests beside them (`*.test.mjs`, `npm run test:scripts`). See `docs/CHANGE-SCOPE.md`.
- `tests/a11y/` Playwright + axe accessibility check (CI job `a11y`, run against the built site via `scripts/preview.mjs`); `playwright.config.ts`. `src/lib/routes.ts` is the single route list used by `sitemap.ts` and the accessibility test.
- `lighthouserc.cjs` Lighthouse CI config (CI job `lighthouse`; pages come from `src/lib/routes.ts`); `scripts/lighthouse-summary.mjs` writes the score table to the job summary.
- `public/_headers` is the Cloudflare Workers header config. `public/_redirects` holds old-site redirects (comments only until launch). `.github/workflows/ci.yml` runs the checks.
- Design tokens (colors, type scale, radii, shadows) are defined once: the palette and Tailwind theme in `src/app/hl.css`, the base layer (body, headings, focus ring) in `src/app/globals.css`. Use the tokens (`ink`, `silver`, `green`, `rust`, `tint`, `hairline`, ...); never hard-code hex values in components (the OG image route is the one exception because it cannot use CSS). Fonts (Outfit for headings and UI, Inter for body, Newsreader italic for the second voice; no others) are declared only in `src/lib/fonts.ts` through `next/font/google`, which self-hosts them at build time. No third-party font or script tags, with one exception: Cloudflare Turnstile (`https://challenges.cloudflare.com`), which `src/components/hl/useTurnstile.ts` loads only after the visitor focuses the contact form.

## Content rules (non-negotiable)

- The authoritative source is `docs/website-plan.md` (Revision 7.1, Section B) and the launch article draft. **Preserve approved copy verbatim.** Do not paraphrase, "improve", or add claims.
- **Pricing:** the only published price is "from `[[$750]]`" for a website (Rev 7.1). The Workflow Review fee is discussed on the call and never published. Never hard-code any other price, rate or dollar amount.
- Do not invent credentials, results, statistics, client names, or certifications. Do not name the former agency or its clients. Agency work is never presented as [[CLIENT_NAME]] client work. Do not claim time savings for [[CASE_STUDY_CLIENT]].
- Voice: first person ("I"), one person, never "we/our team/hundreds of clients". Avoid "digital transformation", "unlock", "leverage", "synergy", "AI-powered". [[PLATFORM_NAME]] never appears in the hero, headlines or nav. The "[[PUN]]" pun is used exactly twice (Contact eyebrow and 404).
- Unknowns are written as `[[double-bracket placeholders]]` inside content strings. The `Text` component renders them as highlighted, visible markers. Do not delete a placeholder to hide a gap; resolve it with the real value. `npm run check:placeholders` lists every unresolved one and fails while any remain; `npm run build:launch` runs it before building. Provider settings in `site.ts` (`email`, `schedulerUrl`, `linkedInUrl`) must also be non-null at launch, and every flag in `decisionsConfirmed` must be `true`.
- Copy is rendered as plain React text. `Text` supports only `**bold**` and `[[placeholder]]`. **Never use `dangerouslySetInnerHTML`** except in `components/ui/JsonLd.tsx`, which serializes static objects and escapes `<`. No markdown-to-HTML or user-supplied HTML.

## Security rules

- No secrets in the repo, in `NEXT_PUBLIC_*` variables, or in client code. The only env var is `NEXT_PUBLIC_SITE_URL` (public). `.env*` files are git-ignored except `.env.example`.
- `public/_headers` must keep: CSP, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, HSTS, COOP/CORP. The CSP needs `'unsafe-inline'` for scripts/styles only because the Next.js static export inlines its bootstrap scripts. Do not loosen it further. When adding a provider (scheduler iframe, form endpoint, analytics script) add only the exact origin it needs (`frame-src`, `connect-src`, `script-src`) in the same change and document it in the README.
- External links (`http(s)://`) must use `target="_blank" rel="noopener noreferrer"`. `Button` does this automatically; hand-written anchors must too.
- **Contact form Worker.** Secrets exist only as Worker secrets that [[OWNER_NAME]] sets personally (`wrangler secret put`, and `wrangler preview base-config secret put` for previews); `wrangler.jsonc` lists names only (generated from `contact.sheetWriter`). Always `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY`; then `SHEET_WEBHOOK_URL` and `SHEET_WEBHOOK_SECRET` for the `apps-script` writer, or `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID` for the `service-account` writer. The full table, with the commands and the Apps Script properties, is `docs/SECRETS.md` (names only, never values). Keep every layer: same-origin check, size limit, rate limit, honeypot (an honest error, never a pretend success), the shared validation, server-side Turnstile with hostname and action checks, the formula guard on every Sheet cell (plain text in the Sheet: RAW input for the service account, a `"@"` number format in the Apps Script), a shared-secret check and a fixed tab allow-list in the Apps Script, a plain-text notification, and an automatic reply whose HTML is a fixed template (the escaped first name is the only visitor input; the booking link comes from `contact.schedulerUrl` in `site.config.ts`, never the request origin). Sheet-writer logs hold fixed event names and status codes only, never the web-app URL, the secret or row data. Preview mode must never email anyone but the site's own address or write to the production tab (`contact.sheetTabs.production`). Never ask visitors to submit sensitive data (client or health records) through the form.
- Scheduling is a **placeholder until a provider is chosen**: set `contact.schedulerUrl` in `site.config.ts` and add its origin to the CSP (`csp.*` in `site.config.ts`, then `npm run sync:config`).
- Dependencies: keep them minimal. Runtime dependencies are only Next, React and React DOM; justify any new one in the PR. Dev-only tooling (Tailwind, ESLint, TypeScript, Wrangler, and `@playwright/test` + `@axe-core/playwright` for the accessibility check, and `@lhci/cli` for Lighthouse) never ships in the site bundle. Install `@playwright/test` only; never also `playwright` (one Playwright version). Tooling added from now on is exact-pinned (no `^`) and must be at least 7 days old when added. `package.json` `overrides` pins `playwright-core` and `basic-ftp`; remove an override when the upstream package no longer needs it. Commit `package-lock.json`; CI installs with `npm ci` under npm 10 (`engines.npm` documents npm 10; no `engine-strict`, so Dependabot's npm can update; generate lockfile changes with npm 10, see CLAUDE.md).
- CI runs two security scans, both enforced by the "Protect main" ruleset: `dependency-review` (pull requests; a required status check; fails on a newly added dependency with a known vulnerability, dev dependencies included) and `codeql` (pull requests, pushes to `main`, weekly; JavaScript/TypeScript, no build; enforced through the "Require code scanning results" rule). Both are SHA-pinned and declare minimal `permissions`.

## SEO, accessibility, performance

- Every page exports metadata via `pageMetadata()` (`src/lib/metadata.ts`) using the exact SEO title and description from the copy doc, a canonical path, Open Graph and Twitter tags. The site origin comes from the single constant `siteConfig.url` in `src/content/site.ts` (override with `NEXT_PUBLIC_SITE_URL`). New indexable routes must be added to `src/app/sitemap.ts`. `/contact/thanks` and the 404 are `noindex` and stay out of the sitemap.
- Organization JSON-LD is on the homepage only (`src/app/(site)/page.tsx`, one script), built from `site.config.ts` by `src/lib/organization-jsonld.ts` (a pure builder, tested in `src/lib/organization-jsonld.test.ts`; `site-organization.ts` feeds it). It states name, URL, description and founder; logo (`brand.logo`) and email only when the site shows them. A field that is empty or holds a `[[placeholder]]` is left out, and without a usable name and URL there is no script. Still no `areaServed`, address, geo, `priceRange`, rating, review or `sameAs` until confirmed.
- One `<h1>` per page, logical heading order, landmarks (`header`, `nav` with labels, `main#main`, `footer`), skip link, visible `:focus-visible` outlines (a rust ring), 44px minimum tap targets, descriptive link text, alt text on every meaningful image (decorative SVG is `aria-hidden`). Respect `prefers-reduced-motion` (see Motion rules). No carousels, auto-play, parallax, pop-ups or auto-rotating quotes.
- Color pairs must keep WCAG AA contrast (see tokens). Sticky or translucent bars over page content use at least a `/95` background so text keeps AA contrast over dark sections. Run the axe check described in the README after visual changes.
- Images: use `next/image` with explicit `width`/`height` (or `fill` with a sized parent), real `alt`, and files sized for display. Screenshots of client work must have client, patient and employee names blurred, and be labeled "Demo data" if mocked.

## Code quality

- Strict TypeScript, no `any`, no `@ts-ignore`. ESLint uses `eslint-config-next` (core-web-vitals + TypeScript). Fix warnings; do not disable rules without a comment explaining why.
- Keep it simple: small components, props typed explicitly, content passed in via props or imported from `src/content`. No state libraries, CSS-in-JS, animation libraries or component libraries. Tailwind utility classes with tokens; shared patterns become components, not copied class strings.
- Comments explain non-obvious intent only. No narrating comments.
- Commit in small logical steps with clear messages. Never commit `.next/`, `out/`, `node_modules/` or env files.

## Motion rules

The motion design is `docs/STYLE-GUIDE.md` §9. The rules below are the guardrails. The static design is always the resting state: every animation must end exactly in it, and removing a rule must never change how a page looks.

- **Where it lives.** Keyframes, the door, tilt, arc and menu-panel (`.panel`) rules are in `src/app/hl.css`; the shared timing tokens (`--ease-site`, `--duration-feedback`, `--duration-panel`) are in `src/app/globals.css`, and Tailwind's default transition uses them, so a plain `transition-colors` is already compliant. Add new motion by extending these, not per page.
- **One focal animation per page.** The starter has none; if a page gets one, do not add a second. Do not add a second focal animation to a page.
- **Never hide content behind motion.** Body copy, actions and links are visible in the initial HTML. Headline and hero intros are CSS keyframes with `both`/`backwards` fill, so they need no JS. The only JS-gated hidden state is the decorative diagram, behind the `js` class that an inline script in `<head>` sets before first paint; without JS the final drawing shows.
- **Reduced motion.** `prefers-reduced-motion: reduce` sets `animation: none` and `transition: none` globally (end of `hl.css`), so the end state shows immediately, and the badge turn and door swing are switched off. Any new animation must be safe under that rule (no state that only a running animation reveals).
- **Scrolling stays native.** The only scroll listener is the passive one in a client component, if one is added (off under reduced motion). The starter has none. No scroll hijacking, scroll-linked effects or wheel/touch listeners; use `IntersectionObserver` for reveal-on-view.
- **No motion libraries.** CSS transitions and keyframes only.

## Checks (must pass before every PR)

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit (site), then tsc --noEmit -p worker
npm run test:worker # contact Worker tests and src/lib/*.test.ts (node --test, no network)
npm run test:scripts # scripts/*.test.mjs (node --test, fake diffs, no network)
npm run build       # static export to ./out
npm run check       # check:config, lint, typecheck, test:worker, test:scripts, build, in order
npm run check:placeholders   # launch gate; expected to fail until placeholders are resolved
npm run check:scope   # change scope: tier 1 (content) or tier 3 (needs the owner); compares HEAD with origin/main
npm run report:changes   # before and after screenshots of changed pages; needs `npm run build` first and Chromium or Google Chrome
npm run strip:images   # removes hidden camera and location data from images added or changed on this branch (--check only reports, --all does every image)
npm run test:a11y   # Playwright + axe; needs `npm run build` first and an installed Chromium; not part of `npm run check`
npm run test:lighthouse   # Lighthouse CI; needs `npm run build` first and Google Chrome; not part of `npm run check`
```

CI job `a11y` runs `test:a11y` on every PR. It is a required check: a failure blocks merging.

CI job `lighthouse` runs `test:lighthouse` on every PR. It is a required check: a failure blocks merging.

Client change requests are made on branches named `change/<short-name>`. On those branches the change scope check (`npm run check:scope`, `docs/CHANGE-SCOPE.md`) fails on any file outside tier 1, a bad image (not jpg, png or webp, over 500 KB, or still carrying hidden camera or location data: run `npm run strip:images`), an image that is not used with real alt text written next to it, or a new `[[placeholder]]`; on every other branch it only reports. The `change-scope` and `change-report` CI jobs are not required checks yet.

- `check`, `a11y`, `lighthouse` and `dependency-review` are required checks in the "Protect main" ruleset, and the "Require code scanning results" rule (CodeQL) also blocks merging on new alerts. Never rename or remove those jobs, add a `paths:` filter or job-level `if:` to them, use `[skip ci]`, or change `.github/workflows/codeql.yml`'s languages or category; change the ruleset first (see CLAUDE.md).
- Fix a failing `a11y` or `lighthouse` job at its cause. Do not loosen a threshold or add a `known-issues.ts` entry just to get green.
- `.github/workflows/**`, `.claude/hooks/**`, `.claude/agents/**`, `.claude/skills/**` and `.claude/settings*.json` are owner-edited: Claude's hooks block changes to them, so a workflow or hook change is written to the scratchpad and copied into place by the owner (see CLAUDE.md and `.claude/hooks/README.md`).

CI (`.github/workflows/ci.yml`) runs `check` (lint, typecheck, build, a check that the deploy artifacts exist: `out/index.html`, `404.html`, `sitemap.xml`, `robots.txt`, `_headers`, and an informational placeholder report), plus `a11y` and `lighthouse`, on every PR.

## Maintenance

- Upgrading Next.js: read the bundled docs in `node_modules/next/dist/docs/` first, then re-run `npm run check`, re-test the static export (`npm run preview`) on every route, and re-verify the CSP in the browser console.
- Adding a page: content module in `src/content/`, route in `src/app/<route>/page.tsx` using `pageMetadata`, nav/footer entry if needed, add the route to `src/lib/routes.ts` (feeds the sitemap and the accessibility check), and a check that it renders with no console errors at mobile and desktop widths.
- Adding an Insights article: Insights is currently a "coming soon" page. The planned article format (short-version box, "Try this this week" callout, author box, CTA, related articles, `BlogPosting` JSON-LD with real published/reviewed dates) is described in the V1 copy doc; add routes, sitemap entries and a content type then. Never invent statistics; label hypothetical examples; anonymize client details.
- Launch checklist lives in the README. Every merge into `main` is a production deploy through Cloudflare Workers Builds (settings in the README's "Deploy to Cloudflare Workers" section); never run `wrangler deploy` by hand, and the owner merges.
