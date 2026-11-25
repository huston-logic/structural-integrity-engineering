# Status: structural-integrity-engineering

Business priorities live in the Google Doc "00 Huston Logic: Source of Truth"; this file is the repo's status.
Rules for keeping it: CLAUDE.md, "Status and source of truth". How sites are built: `docs/PROCESS.md`. Older history:
`docs/history/STATUS-history.md`. Task list for the Nov 23 autonomous run: `docs/PLAN.md`.
Updated at the end of the Nov 24 run "Feedback round 1".

## Current state

- **Repo:** `huston-logic/structural-integrity-engineering`, made on 2026-11-23 from the `huston-logic/site-template`
  GitHub template. Default branch `main`.
- **Site:** the new website for Structural Integrity Engineering (Dylan Gassmann, structural engineer, Colorado), replacing
  his Wix site at the same addresses. Dylan is focusing on Colorado, so the site says Colorado everywhere except one
  licensing line on About ("Licensed in Colorado and Alaska."). Copy: `incoming/sie-site-assets/copy-deck.md` (git-ignored;
  its Alaska lines were edited locally to match, the Claude Doc still has the old ones). Design: home page option G,
  "Dusk", applied to every page, with Dylan's logo (`public/brand/sie-logo.svg`) on a snow hexagon badge.
- **Built and merged:** all 12 build tasks and the process port. Pages: `/`, `/services`, the three service pages,
  `/about-us`, `/contact-us`, `/contact-us/thanks` (noindex), `/privacy`, the 404.
- **Open:** the feedback round 1 PR (branch `feat/feedback-round-1`): logo and icons, the logo-click scroll fix, Colorado
  focus, the privacy page, one line drawing on each inner page, the earlier review items and rate-limit ids 2201 and
  2202. Not set to auto-merge: Grant reviews the Cloudflare preview first.
- **Live:** nothing yet. Production is the workers.dev link from the first Cloudflare build.

## Needs Grant

In order:

1. Review the preview and the PR description (every copy change is listed before and after). Merge when happy.
2. Ask Dylan to read the new privacy page (`src/content/privacy.ts`), mainly "How long we keep it" and "Your choices and
   rights", and the naming of Huston Logic as host. Decide whether Cloudflare Web Analytics is switched on in the
   dashboard (the page says Cloudflare "may count visits without cookies"; nothing in the code loads it).
3. Approve the site-voice copy in the PR: the form error messages, the automatic reply's greeting ("Hello,") and sign-off
   ("Talk soon,"), and the 404 message. Also the new page titles (Engineering services, Residential design, About Dylan
   Gassmann).
4. Update the Claude Doc "Structural Integrity Engineering: site copy deck" with the Alaska changes (the PR lists them);
   the local deck is already edited. Dylan's phone number is a (907) number: keep it or give a Colorado number.
5. Check that the "Protect main" ruleset and "Allow auto-merge" are on for this repo
   (`docs/ruleset-protect-main.json`, `docs/pipeline/client-onboarding-checklist.md`).
6. Cloudflare: the rate limiter ids changed to 2201 and 2202 in `wrangler.jsonc`; nothing to do unless another Worker in
   the account already uses them. Connect or confirm Workers Builds settings (README, "Deploy to Cloudflare Workers").
7. Cloudflare Turnstile: create the site key and secret; put the site key in `site.config.ts` (`turnstileSiteKey`,
   currently `null`) and the secret as a Worker secret.
8. Resend: account, domain and `RESEND_API_KEY` (Worker secret). Email DNS for `structural-integrity-engineering.com`.
9. The Google Sheet and the Apps Script web app (`docs/apps-script/contact-sheet.gs`); set `SHEET_WEBHOOK_URL` and
   `SHEET_WEBHOOK_SECRET` (`docs/SECRETS.md`). The Sheet header row is: Received (UTC), First name, Last name, Email,
   Phone, Project city and state, Project scope, Mode.
10. DNS for the domain.
11. Open Manrope files for the OG image: add two Manrope TTFs (Regular and SemiBold) to `src/assets/og` and change the
    font names in `src/app/og.png/route.tsx` (the OG card still uses Outfit TTFs).
12. Playwright's Chromium (build 1255) is not installed on this Mac (an older one is). The local accessibility run used
    the installed Google Chrome. To run `npm run test:a11y` as CI does: `npx playwright install chromium` (approval).
13. Then `npm run check:placeholders` (the privacy page and the 404 no longer hold placeholders).
14. Owner batch for the fast hooks (process, about 5 minutes; do it after the process-port PR has merged):
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

Still waiting on Dylan (not changed this round):

- Company name in the footer ("Structural Integrity Engineering, Inc." used).
- The 48-hour and 10-year claims; the engineering terms in the four condition lines on the home page.
- The Residential and Commercial question sets are not in the deck, so the /services accordion ships with the glazing
  set only (heading now "Glazing questions").
- The deck uses "we" although Dylan works alone.
- Testimonials and real project photos (the portrait comes from the Wix site; ask Dylan for a sharper one).
- The low-rise commercial page H1 is the deck's "Commercial design".
- The privacy page meta description is the footer line (the deck has none).

## For the master

- Dylan is focusing on Colorado: the site no longer markets Alaska; his Alaska licence is mentioned once, on About.
- The site now has Dylan's logo, tab icon and a privacy page that states only what the site does.
- Each inner page has one line drawing in the home hero's style; the style guide's "other pages have none" changed.
- To bring back to site-template: the Next 16 `data-scroll-behavior="smooth"` fix and its test; `PageDrawing`.
- This repo follows the site template's docs/PROCESS.md.

## Last run

**Feedback round 1, 2026-11-24** (site change run, one branch, one PR: `feat/feedback-round-1`). Grant's brief, nine
items, built inline on Sonnet with a Haiku scout. Plan: `docs/superpowers/plans/2026-11-24-feedback-round-1.md`.

- Logo on a snow hexagon badge (8.8:1 on dusk, 11:1 on dusk-deep; the mark itself is untouched), favicon and apple icon.
- Bug: Next 16 no longer switches off `scroll-behavior: smooth` during a page change, so the new page glided to a random
  section. Fix: `data-scroll-behavior="smooth"` on `<html>`. New `tests/a11y/navigation.spec.ts` (red before, green after).
- Colorado focus, new glazing photo (Unsplash, credited), the privacy page, one drawing per inner page, shorter titles
  (new 60-character test), "Glazing questions", site-voice messages, rate-limit ids 2201 and 2202.
- Reviews once on the whole branch: review-code, review-a11y and review-security, then a design critique from screenshots
  at 1440 and 390. Fixed: the drawing's class conflict, a missing under-stroke on the glazing curve, the deprecated
  `priority` prop, a privacy docblock that contradicted the copy, an inline error string. Deferred minors (older code): the
  logo's ", home" label and the skip link text are inline in JSX; ten unused photo entries and files; email helper cleanup.
- Judgment calls: photo drawings are snow with a dark under-stroke because amber vanished on wood and glass; the home
  "2 states" figure was dropped so the licensing line appears once; the local copy deck was edited so the verbatim SEO test
  still passes; the contact drawing shows only from 900px; privacy, thanks and 404 stay still; the 907 number was kept.

| Measure | Result |
|---|---|
| Wall-clock time | about 35 minutes |
| Commits | 6 |
| Time in checks | about 8 minutes (3 full checks through the commit hook, 3 Playwright runs, one Lighthouse run of about 3 minutes) |
| Time waiting on CI | not waited on; the PR is left for Grant's review |
