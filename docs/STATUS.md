# Status: structural-integrity-engineering

Business priorities live in the Google Doc "00 Huston Logic: Source of Truth"; this file is the repo's status.
Rules for keeping it: CLAUDE.md, "Status and source of truth". Task list for the Nov 23 autonomous run: `docs/PLAN.md`.
Updated at the end of the Nov 23-24 autonomous run.

## Current state

- **Repo:** `huston-logic/structural-integrity-engineering`, made on 2026-11-23 from the `huston-logic/site-template`
  GitHub template. Default branch `main`.
- **Site:** the new website for Structural Integrity Engineering (Dylan Gassmann, structural engineer, Colorado and
  Alaska), replacing his Wix site at the same addresses. Copy: `incoming/sie-site-assets/copy-deck.md` (git-ignored,
  exported from Grant's Claude Doc "Structural Integrity Engineering: site copy deck", rev 8). Design: home page
  option G, "Dusk", applied to every page.
- **Built and merged:** all 12 tasks. Pages: `/`, `/services`, the three service pages, `/about-us`, `/contact-us`,
  `/contact-us/thanks` (noindex), `/privacy`, the 404. Contact form with the six deck fields, end to end through the
  Worker (no live secrets). Per-page titles and descriptions come from `src/content/seo.ts`.
- **Live:** nothing yet. Cloudflare Workers Builds is not connected to this repo.
- **Open:** Dependabot PR #1 only (Grant is handling it).

## Changelog

- 2026-11-23: repo made from site-template; `docs/PLAN.md` and this file reset for the site build.
- 2026-11-23/24: autonomous run. PRs #2 (client config), #3 (booking link and LinkedIn may be "none"), #4 (design
  system), #5 (photos), #6 (home page), #7 (routes), #8 (/services), #9 (service pages), #10 (about), #11 (contact),
  #12 (SEO and finish), #13 (gzip in `scripts/preview.mjs`, approved by Grant, opened by the main session), #14
  (visual polish). This PR closes the run.

## Needs Grant

In order:

1. Check that the "Protect main" ruleset and "Allow auto-merge" are on for this repo
   (`docs/ruleset-protect-main.json`, `docs/pipeline/client-onboarding-checklist.md`).
2. Connect Cloudflare Workers Builds to this repo and set the preview and production settings (README, "Deploy to
   Cloudflare Workers").
3. Cloudflare Turnstile: create the site key and secret; put the site key in `site.config.ts` (`turnstileSiteKey`,
   currently `null`) and the secret as a Worker secret.
4. Resend: account, domain and `RESEND_API_KEY` (Worker secret). Email DNS for `structural-integrity-engineering.com`.
5. The Google Sheet and the Apps Script web app (`docs/apps-script/contact-sheet.gs`); set `SHEET_WEBHOOK_URL` and
   `SHEET_WEBHOOK_SECRET` (`docs/SECRETS.md`). The Sheet header row is: Received (UTC), First name, Last name, Email,
   Phone, Project city and state, Project scope, Mode.
6. DNS for the domain.
7. Open Manrope files for the OG image: add two Manrope TTFs (Regular and SemiBold) to `src/assets/og` and change the
   font names in `src/app/og.png/route.tsx` (the OG card still uses Outfit TTFs).
8. Review the privacy page (`src/content/privacy.ts`; sections still hold placeholders, `[[Grant to review: privacy
   page]]`), the `[[404 message]]` placeholder, and the copy questions below. Then `npm run check:placeholders`.
9. Dependabot PR #1.

Copy questions (from the copy deck's open items and the run):

- Company name in the footer ("Structural Integrity Engineering, Inc." used).
- The 48-hour and 10-year claims; the engineering terms in the four condition lines on the home page.
- The Residential and Commercial question sets are not in the deck, so the /services accordion ships with the glazing
  set only under the heading "Questions" (consider "Glazing questions").
- The low-rise commercial page H1 is the deck's "Commercial design".
- Form microcopy not in the deck: field error messages, "All fields are required.", the send-failed message, the
  7 to 15 digit phone rule, "Please try again shortly."
- The automatic reply has no greeting or sign-off (none in the deck).
- Privacy page: title case "Privacy Policy" and the privacy meta description (the footer line is used).
- `storefront-dusk.jpg` is a rendering showing third-party retail brand logos: crop or replace. The portrait comes
  from the Wix site (ask Dylan for a sharper one).
- The deck uses "we" although Dylan works alone.
- Page titles over 60 characters (services, residential, about).

## For the master

- New client site built from site-template in one autonomous run on Nov 23-24 (13 PRs, all merged except Dependabot).
- To bring back to site-template: optional booking link and LinkedIn ("none"); the Worker with no booking link; the
  field-driven contact form; gzip in `scripts/preview.mjs` (so Lighthouse measures what Cloudflare serves); the
  CSS-only scroll-reveal motion rule; `SplitSection`; the photo variants workflow; the Worker/config color tokens.
