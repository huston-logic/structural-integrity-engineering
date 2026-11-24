# Status: structural-integrity-engineering

Business priorities live in the Google Doc "00 Huston Logic: Source of Truth"; this file is the repo's status.
Rules for keeping it: CLAUDE.md, "Status and source of truth". How sites are built: `docs/PROCESS.md`. Older history:
`docs/history/STATUS-history.md`. Task list for the Nov 23 autonomous run: `docs/PLAN.md`.
Updated at the end of the Nov 24 process run "Port the website process".

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
- **Process:** follows the site template's `docs/PROCESS.md` (template commit `99e5378`). `npm run check:fast` (config,
  process rules, lint, typecheck, tests) and `npm run check` (fast check plus build) are in place; Lighthouse CI runs 3
  times per page. The pre-commit hook still runs the full check, and the pre-push hook is not installed, until the
  owner batch below.
- **Live:** nothing yet. Cloudflare Workers Builds is not connected to this repo.
- **Open:** the process-port PR (branch `chore/port-website-process`). Dependabot PR #1 was closed on 2026-11-24; its
  bump merged as #16.

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
9. Owner batch for the fast hooks (process, about 5 minutes; do it after the process-port PR has merged):
   1. In your own terminal run `bash /private/tmp/claude-501/-Users-granthuston--claude-spares-spare-XsjcpE/48d0597f-3108-4fd2-ac84-228966b56113/scratchpad/owner-batch/owner-batch.sh`.
      It makes `chore/owner-fast-hooks` from an updated `main`, copies the template's `scout` and `docs-writer`
      agents, `precommit-check.mjs` (fast), `prepush-check.mjs` (full check before push and PR), `selftest.mjs`, the
      hooks README and `settings.json` into `.claude/`, sets `precommitHookFastOnly` to `true`, then runs the hook
      selftest (last line must say `All 132 passed`), `npm run check:process` (must say all 7 rules passed) and
      `npm run check`. It commits nothing.
   2. If it all passes: `git add .claude scripts/process-rules.json`, commit, `git push -u origin chore/owner-fast-hooks`,
      `gh pr create --fill`, then `gh pr merge <number> --auto --squash`.
   3. If the scratchpad was cleared by a reboot, re-clone `huston-logic/site-template` and ask Claude to rebuild the
      batch; no hook or settings change in this repo is missing from the template, so nothing is lost.

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
- This repo now follows the site template's docs/PROCESS.md.

## Last run

**Port the website process, 2026-11-24** (process run, one branch, one PR: #17, `chore/port-website-process`). Brought
this repo in line with the site template at `99e5378`. Site content, copy, photos and `site.config.ts` untouched.

- Added `scripts/check-process.mjs`, its 12 tests and `scripts/process-rules.json` (flag `false` until the owner
  batch). `package.json` has `check:process` and `check:fast`; `check` is `check:fast` then `build`, with every step the
  old `check` had.
- `lighthouserc.cjs`: `numberOfRuns` 5 to 3 (approved by Grant). No threshold or assertion touched.
- `docs/PROCESS.md` and `docs/LAUNCH-CHECKLIST.md` copied from the template (PROCESS.md with this repo's own timings);
  `docs/pipeline/README.md` got one line; `CLAUDE.md` has the template's "Autonomous runs" and the `check:fast` per
  commit rule; this file was cut to its four parts and the older changelog moved to `docs/history/STATUS-history.md`.
- Owner-only files: the template's version of 7 files is ready as `.proposed` files with one batch script (Needs Grant
  item 9). This repo has no hook or settings change that the template lacks, so nothing needs to be kept back.
- Review: review-code and review-security once on the whole branch. review-a11y and the design critique were skipped:
  no site file changed.
- Judgment calls: the `.proposed` files and the batch script are in the scratchpad (CLAUDE.md), not in the repo. The old
  Needs Grant item for Dependabot PR #1 was dropped because the PR is closed. CLAUDE.md also says agents read
  `docs/pipeline/` only for hooks, CI or deploy tasks (PROCESS.md rule 9 says it belongs there; the template's
  CLAUDE.md lacks the line, so port it to the template if you agree).

| Measure | Result |
|---|---|
| Wall-clock time | about 15 minutes |
| Commits | 4 |
| Time in checks | about 2.5 minutes (estimate: the before and after timing runs, the pre-commit hook runs and the final check) |
| Time waiting on CI | not waited on; auto-merge is queued behind the required checks |

| `npm run check` step | Before | After |
|---|---|---|
| `check:config` | 0.2 s | 0.2 s |
| `check:process` (new) | | 0.1 s |
| `lint` | 3.1 s | 2.6 s |
| `typecheck` | 2.0 s | 1.2 s |
| `test:worker` | 0.4 s | 0.3 s |
| `test:scripts` | 4.8 s | 4.8 s |
| `build` | 5.6 s | 4.4 s |
| `npm run check:fast` as one command | | 10.7 s |
| `npm run check` as one command | 16.1 s | 14.1 s |

Single runs vary by a few seconds.
