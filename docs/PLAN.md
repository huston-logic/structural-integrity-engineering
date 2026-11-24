# Autonomous run plan (approved 2026-11-18)

The task list for the autonomous run described in CLAUDE.md, "Autonomous runs". Progress is tracked in
`docs/STATUS.md`. One PR per task.

## Tasks

1. **T3b: Organization JSON-LD on the homepage only.** Built from `site.config.ts` in
   `src/lib/organization-jsonld.ts`. Fields: name, url, logo, description, email (only if the site shows it), founder
   name and title (only if the site shows them). Skip empty or `[[placeholder]]` fields. No address, geo, priceRange,
   rating or review. One script, server-rendered, `<` escaped.
2. **Redirect slot for old-site URLs.** An empty `public/_redirects` (Workers static assets) with a header comment on
   the format, plus `scripts/check-redirects.mjs`, which reads a list of old URLs and a base URL and reports any that
   do not 301 to a 200. Add it to the README launch section.
3. **T4: the contact Worker reads every value from `site.config.ts`.** Email, sender and reply names, booking link,
   Worker name, sheet tabs, rate-limit ids. Swap those to `[[...]]`, use test fixtures in the Worker tests, and keep the
   automatic reply generic from config. Make the Google Apps Script web-app writer (shared secret) the default Sheet
   writer and keep the service-account writer as an option. Add `docs/SECRETS.md` listing every secret and where to
   set it (production and preview). `build:launch` must fail on all remaining placeholders: prove it. No real
   secrets, no live email.
4. **T5 (non-owner parts).** Export the "Protect main" ruleset with `gh api` into `docs/ruleset-protect-main.json`.
   Remove owner-specific wording from `docs/pipeline/*`. Add `docs/LAUNCH-CHECKLIST.md` as a stub headed "Filled in by
   Grant". Queue as proposals: the `.claude/agents/*.md` "this site" wording, and the stale "NOT a required check"
   comments in `ci.yml`.
5. **T1c: Dependabot fix**, only if `@lhci/cli` 0.16.1 is at least 7 days old on the day it runs (otherwise queue it).
   Bump `@lhci/cli` to 0.16.1, and bump `@playwright/test` together with `overrides.playwright-core` to the same
   version (1.65.x if it is 7 days old). Prove it in a scratch copy: generate the lockfile with `npx npm@12`, then run
   `npm ci --dry-run` with the repo's npm 10. If green and merged, close Dependabot PR #3 with a comment linking the
   fix.
6. **Mark the repo as a template:** `gh api -X PATCH repos/huston-logic/site-template -F is_template=true`.

## Stop list

Queue the item and continue with other tasks on: secrets or credentials, DNS, accounts or money, sending real email,
deleting user data, lowering any threshold or required check, or any owner-only path (`.claude/hooks|agents|skills|
settings*.json`, `.github/workflows`). For owner-only changes, write `<file>.proposed` to the scratchpad and list it.

New dependencies: exact-pinned, at least 7 days old (`npm view <pkg> time`), and `dependency-review` must pass. Flag
them in the summary.

## End of run

Post one summary with every PR link and whether it merged, anything flagged (dependencies, judgment calls), the stop
queue, and the exact hand-copy commands for all proposals in one batch. Update `docs/STATUS.md`.
