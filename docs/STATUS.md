# Status: structural-integrity-engineering

Business priorities live in the Google Doc "00 Huston Logic: Source of Truth"; this file is the repo's status.
Rules for keeping it: CLAUDE.md, "Status and source of truth". How sites are built: `docs/PROCESS.md`. Older history:
`docs/history/STATUS-history.md`. Deliberate differences from the template: `docs/SITE-DIFFERENCES.md`.
Updated at the end of the Nov 25-26 run "Catch up to the template".

## Current state

- **Repo:** `huston-logic/structural-integrity-engineering`, from the `huston-logic/site-template` GitHub template.
- **Site:** Structural Integrity Engineering (Dylan Gassmann, structural engineer, Colorado), replacing his Wix site at the
  same addresses. Design: option G, "Dusk", unchanged. Pages: `/`, `/services` and its three service pages,
  `/about-us`, `/contact-us`, `/contact-us/thanks` (noindex), `/privacy`, the 404.
- **Caught up to the template (main, 8c49fcd):** every page is a JSON page file built from 20 site blocks; the site
  editor, owner uploads, collections (posts, videos, episodes, testimonials, team), business details, the site notice,
  owner-built forms and download forms, and the Pipeline destination for the contact form are all in the code and all
  **off**. No account, secret, binding or DNS was created.
- **Kept as this site has it (docs/SITE-DIFFERENCES.md):** the `/contact-us` and two-level `/services/...` addresses; the
  menu (with its Services submenu) in `nav.ts`, so the editor refuses menu changes; the brand (Dusk colors, Manrope,
  the SVG logo) is fixed and the editor refuses brand changes; the template's example items and `/blog` page are kept but
  archived; the contact form keeps its six fields and its own design.
- **Live:** nothing yet. Production is the workers.dev link from the first Cloudflare build.

## Needs Grant

In order. Site names filled in; values that need an account stay with you.

**A. Before launch (unchanged from the last run, still open)**
1. Ask Dylan to read the privacy page (`src/content/pages/privacy.json`) and to approve the site-voice copy (form
   messages, the auto-reply's "Hello," and "Talk soon,", the 404, the page titles). Decide on Cloudflare Web Analytics.
2. Update the Claude Doc copy deck with the Alaska changes. Dylan's phone is a (907) number: keep it or give a Colorado one
   (it now lives in `src/content/business.json`).
3. Turnstile site key (`contact.turnstileSiteKey`) and secret; Resend account, domain and `RESEND_API_KEY`; the Google
   Sheet and Apps Script web app with `SHEET_WEBHOOK_URL` and `SHEET_WEBHOOK_SECRET` (`docs/SECRETS.md`); DNS.
4. Two Manrope TTFs for the OG image (`src/assets/og`, `src/app/og.png/route.tsx`).
5. `npx playwright install chromium` (approval) to run `npm run test:a11y` locally as CI does.
6. Then `npm run check:placeholders`. The archived template examples hold 26 `[[placeholders]]`; delete those files or
   leave them archived (`docs/SITE-DIFFERENCES.md` D12).
7. Still waiting on Dylan: the footer company name ("Structural Integrity Engineering, Inc."); the 48-hour and 10-year
   claims and the four condition lines on the home page; the Residential and Commercial question sets; "we" although he
   works alone; testimonials and project photos (a sharper portrait); the "Commercial design" H1; a privacy meta
   description. Approve "Sending your note." (screen-reader text in the library form block).

**B. Forms (from the forms port).** In Dylan's Sheet: update the Apps Script from `docs/apps-script/contact-sheet.gs`, add
two tabs "Forms" and "Forms preview" with the header row `Received (UTC) | Form | Name | Email | Answers | Mode`, and
deploy a new version of the same web app. Set `TAB_FORMS` and `TAB_FORMS_PREVIEW` only if the tab names differ.

**C. Turn the editor on (docs/EDITING.md steps a to g), after launch on the live domain**
- a. GitHub App in the `huston-logic` org: name `Structural Integrity Engineering editor`, homepage
  `https://structural-integrity-engineering.com`, webhook off; Contents, Pull requests, Issues read and write; Checks and
  Metadata read-only; nothing else; installable on this account only; install on `structural-integrity-engineering` only.
  Note the App ID, the installation id and the bot login (`<app-slug>[bot]`).
- b. `npx wrangler secret put GITHUB_APP_PRIVATE_KEY < path/to/key.pem` (production only), then delete the `.pem`.
- c. `npx wrangler kv namespace create OAUTH_KV` and `npx wrangler kv namespace create EDITOR_KV`; note both ids.
- d. Cloudflare Access: self-hosted app `Structural Integrity Engineering owner`, domain
  `structural-integrity-engineering.com`, path `owner`, One-time PIN, one Allow policy listing only the owner emails (Dylan's
  sign-in address: confirm which one). Note the AUD tag and the team name. Do not protect `/mcp`, `/oauth`, `/.well-known`.
- Before e: the "Protect main" ruleset with its four required checks, and **Allow auto-merge** on (step f).
- e. In `site.config.ts` `editor`: `ownerEmails`, `access.teamDomain` and `access.aud`, `github.appId`,
  `github.installationId`, `github.botLogin` (`github.owner` "huston-logic" and `github.repo` are already set),
  `workersSubdomain`, `kv.oauth` and `kv.editor`; `rateLimitId` is already "2203" (reserved in `docs/HOSTING.md`; add the
  row to the template's register too); `enabled: true` last. Run `npm run sync:config`, commit, PR, merge.
- f. Repo settings: Allow auto-merge on; create the label `owner-request`; Watch, All activity.
- g. Test on the live domain: sign in at `https://structural-integrity-engineering.com/owner`; connect Claude with the custom
  connector `https://structural-integrity-engineering.com/mcp`; ask for one heading change, say yes, ask "is it live yet?"
  until `live` and check `/site-version.json` names the merge commit; ask for a preview of one change; "undo that"; check
  `https://structural-integrity-engineering.com/blocks` is a 404. Note the yes-to-live time.

**D. Turn uploads on (docs/EDITING.md steps h to l), after C**
- h. `npx wrangler r2 bucket create structural-integrity-engineering-uploads` (private; no public access or domain).
- i. `npx wrangler r2 bucket lifecycle add structural-integrity-engineering-uploads expire-inbox --expire-days 31`.
- j. In the Cloudflare dashboard, check Images is available on the account (Free plan is enough).
- k. In `site.config.ts` `editor.uploads`: `bucket: "structural-integrity-engineering-uploads"`, then `enabled: true`.
  `npm run sync:config`, commit, PR, merge.
- l. From a phone at `/owner`: upload a portrait iPhone HEIC (upright thumbnail), a PDF (downloads from the page that uses
  it; check its `/files/...` headers say attachment on the live site), a video (refused, pointing to YouTube or Vimeo),
  then ask for a gallery with the photos and check they are upright.
- Known limit: Dylan's own sections find photos in `src/content/photos.ts`, so an uploaded photo can go only in the
  template's photo blocks for now (D10). Making the site blocks take uploads is a Huston Logic build.

**E. Content fast lane (`docs/proposals/content-fast-lane.md`, proposal, not in force)**
1. Read the three proposed files (`docs/proposals/content-fast-lane-files/`, rebased onto this site) and the rule;
   approve or reject.
2. Make `change-scope` a required check the CLAUDE.md way: 5 clean runs (it already runs on every PR), then a proof PR
   "PROOF - DO NOT MERGE: change-scope", closed with `gh pr close --delete-branch`.
3. Ruleset first: add `change-scope` to "Protect main". Then copy `ci.yml.proposed` to `.github/workflows/ci.yml`,
   `lighthouserc.cjs.proposed` to `lighthouserc.cjs` and `site.a11y.spec.ts.proposed` to `tests/a11y/site.a11y.spec.ts` in
   your own terminal, and run the checks.
4. Watch the first content-only PR: `a11y` and `lighthouse` should name only the touched pages.

**F. For the template (template first, then port):** bring back the deterministic screenshot flags in
`scripts/change-report.mjs`, a configurable contact path, two-level page paths, and a way to keep a site's brand fixed.
Add this site's editor id 2203 to the template's rate-limit register.

## For the master

- Dylan's site now has the template's site editor, uploads, collections and forms in its code, all switched off.
- Dylan's brand (Dusk colors, Manrope, his SVG logo) cannot be changed by chat; it stays a Huston Logic change.
- Dylan's menu cannot be changed by chat; it stays a Huston Logic change.
- The template's example blog, posts, testimonials and team are kept but archived on Dylan's site.
- Owner chat editing for Dylan waits on launch and the GitHub App, Access and Cloudflare setup.
- The site template needs four improvements that Dylan's site needed: deterministic screenshots, a configurable contact
  path, two-level page addresses and a fixed-brand option.
- This repo follows the site template's docs/PROCESS.md as of its main (8c49fcd).

## Last run

**Catch up to the template, 2026-11-25 to 26** (process run, one PR per feature area, each merged before the next).
Plan: `docs/superpowers/plans/2026-11-25-catch-up-to-template.md`. Opus planned and reviewed, Sonnet implemented, Haiku read.
Each step copied the template as it was when that feature merged, because the template's main stacks all five features.

- #21 Pages as blocks (template eb7f06c): 8 page files, 20 site blocks, the block library, content and design checks.
- #22 Hosting docs and the Pipeline destination (#27, #28), moved ahead of the editor because the editor builds on it.
- #23 Site editor (603643a), off. New runtime dependency `@cloudflare/workers-oauth-provider` 1.2.4 (exact, 35 days old).
- #24 Uploads and photos (8bbc73b), off.
- #25 Collections, business details and notice (0cb5018), with the brief's "Move content" step; brand stopped (fixed).
- #26 Forms and downloads (8c49fcd) and #34; Dylan's contact form unchanged. CI's `a11y` failed once: a review fix had
  taken the error description off the form block's choice buttons, which the template's test requires; reverted.
- #27 This STATUS.md.
- Gate on every step: pixel-identical screenshots of every page at 390 and 1440 against a build of main (the 404 shot
  separately in step 1); no tolerance used. Reviews once per PR (code, security, accessibility), all findings fixed.
- Judgment calls: steps run in the template's order (brief step 5 became the second PR; step 2 folded into the collections
  PR); screenshots taken with the GPU off so a page compared with itself is identical; the line drawings draw by a
  transition instead of a stroke keyframe (same timing) because `check:design` allows only opacity and transform; the
  library blocks read Dusk through a token map, with dark cards and a dark form panel where the template's light ones
  failed contrast; site blocks stay as they are, so an uploaded photo goes only in the template's photo blocks for now.
- Off-brand on `/blocks` (preview only): the video placeholder fades dark to light; the template's example photos are cool
  blue still lifes; native checkboxes in the form block are grey squares.

| Measure | Result |
|---|---|
| Wall-clock time | about 3 hours 30 minutes (23:28 to about 03:00 Pacific) |
| Commits | 27 (6, 4, 3, 3, 5, 5 on the six ports, 1 here) |
| Time in checks | about 45 minutes, estimated: a cold build, a before and after screenshot gate and a full `npm run check` per port, plus review-fix reruns |
| Time waiting on CI | about 52 minutes: 6 to 7 minutes per PR, 12 minutes on #26 (one `a11y` failure, fixed at its cause) and about 7 on #27 |
