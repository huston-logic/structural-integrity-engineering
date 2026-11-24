# Status: structural-integrity-engineering

Business priorities live in the Google Doc "00 Huston Logic: Source of Truth"; this file is the repo's status.
Rules for keeping it: CLAUDE.md, "Status and source of truth". Task list for the Nov 23 autonomous run: `docs/PLAN.md`.
Reset on 2026-11-23 for this site.

## Current state

- **Repo:** `huston-logic/structural-integrity-engineering`, made on 2026-11-23 from the `huston-logic/site-template`
  GitHub template. Default branch `main` (one commit, "Initial commit").
- **Site:** the new website for Structural Integrity Engineering (Dylan Gassmann, structural engineer, Colorado and
  Alaska), replacing his Wix site at the same addresses. Copy: `incoming/sie-site-assets/copy-deck.md` (git-ignored,
  exported from Grant's Claude Doc "Structural Integrity Engineering: site copy deck"). Design: home page option G,
  "Dusk".
- **Live:** nothing yet. Cloudflare Workers Builds is not connected to this repo.
- **Merged:** none yet.
- **Open:** none yet. The Nov 23 autonomous run (12 tasks, `docs/PLAN.md`) is starting.

## Changelog

- 2026-11-23: repo made from site-template; `docs/PLAN.md` and this file reset for the site build.

## Needs Grant

In order:

1. Check that the "Protect main" ruleset and "Allow auto-merge" are on for this repo (`docs/ruleset-protect-main.json`,
   `docs/pipeline/client-onboarding-checklist.md`).
2. Items the run queues (Cloudflare, Turnstile, Resend, Worker secrets, the Google Sheet, DNS) will be listed here at
   the end of the run.

## For the master

- New client site started: Structural Integrity Engineering, built from site-template in one autonomous run on Nov 23.
