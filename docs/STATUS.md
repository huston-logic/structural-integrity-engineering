# Status: site-template

Business priorities live in the Google Doc "00 Huston Logic: Source of Truth"; this file is the repo's status.
Rules for keeping it: CLAUDE.md, "Status and source of truth". Task list for the Nov 18 autonomous run: `docs/PLAN.md`.
Last verified with `gh` on 2026-11-22.

## Current state

- **Repo:** `huston-logic/site-template`, a GitHub template (`is_template` is true). Default branch `main`, ruleset
  "Protect main" active, "Allow auto-merge" on.
- **Live:** not checked from the repo. Whether Cloudflare Workers Builds is connected to the template itself is not
  recorded here; client sites deploy from their own repos.
- **Merged:** PRs #1 to #21, all merged except #3 (Dependabot, closed unmerged). Includes the generic starter (#6), the
  generic contact Worker with Apps Script writer and `docs/SECRETS.md` (#10), Organization JSON-LD (#8), the redirect
  slot (#9), the pipeline docs, ruleset export and launch checklist stub (#11), the dependency bumps (#13, #15), the
  installed hook and settings changes that allow `gh pr merge --auto --squash` (#16), the CLAUDE.md cleanup (#17, #18), the STATUS.md format with the CLAUDE.md "Status and source of truth" rules (#19), the change scope check and change report, steps 1 and 2 of the client change requests plan (#20), and hidden camera and location data stripped from client images plus a blocking alt text check (#21).
- **Open:** #22, the `change-scope` and `change-report` CI jobs (proposed in #20, copied into
  `.github/workflows/ci.yml` by Grant). Until it merges, no scope, image-data or alt text check runs on pull requests.
  The jobs are not required checks. No other open PRs.
- **Still open per `docs/TEMPLATE.md`** (that file's PR table may lag the merged PRs): template README polish, and
  deciding which Huston content rules in AGENTS.md stay as template defaults.

## Changelog

- 2026-11-17: #1 generic template identity and `docs/TEMPLATE.md`; #2 remove `engine-strict` so Dependabot's npm 12 can
  update; #4 `site.config.ts` with `sync:config` and `check:config`; #5 CI runs `check:config`. #3 (Dependabot) closed.
- 2026-11-18, autonomous run, product code: #6 generic starter site; #8 Organization JSON-LD on the homepage only;
  #9 redirect slot and `check-redirects`; #10 generic Worker, Apps Script Sheet writer, `docs/SECRETS.md`.
- 2026-11-18, autonomous run, docs and tooling: #7 run rules, PLAN.md, STATUS.md; #11 ruleset export, pipeline docs,
  launch checklist stub; #12 and #14 STATUS updates; #13 `@lhci/cli` 0.16.1 and Playwright 1.65.0 (one-time 7-day
  exception, below); #15 Dependabot npm group bump.
- 2026-11-18, owner install and cleanup: #16 hook, settings, agent and workflow changes hand-copied by Grant; #17 generic
  package description and CLAUDE.md matches the installed hooks; #18 note that new repos need "Allow auto-merge".
- 2026-11-21: #19 STATUS.md rewritten into four sections, CLAUDE.md gets the "Status and source of truth" rules.
- 2026-11-22: #20 `scripts/change-scope-rules.mjs`, `check-change-scope.mjs` (`npm run check:scope`) and `change-report.mjs`
  (`npm run report:changes`) with tests (`npm run test:scripts`), `docs/CHANGE-SCOPE.md`. No new dependencies.
- 2026-11-22: #21 `npm run strip:images` (`scripts/strip-image-metadata.mjs`, `image-metadata.mjs`) removes EXIF,
  GPS, XMP, IPTC, comments and thumbnails from jpg, png and webp without re-encoding; `check:scope` fails a `change/` branch
  whose images still carry them or are not used with real alt text (`scripts/image-alt.mjs`); the change report lists each
  image with its alt text. Pure Node, no new dependencies; STATUS.md corrected for #20.
- 2026-11-22: #22 `change-scope` and `change-report` jobs added to `.github/workflows/ci.yml` (Grant hand-copied
  them; Claude cannot write workflows). Not required checks; strict only on `change/` branches.

## Needs Grant

In order:

1. Review and merge #22. It only adds the two CI jobs (`change-scope`, `change-report`) to `ci.yml`; the four
   required jobs are unchanged and the new jobs are not required checks. Watch its first run: both jobs run on this PR too.
2. Decide how strict mode is enforced. Today it applies only to branches named `change/...`, so it trusts the branch name
   (limit written up in `docs/CHANGE-SCOPE.md`). The ruleset or CODEOWNERS can close that; I did not touch the ruleset.
3. After 5 clean runs of `change-scope`, and a deliberate-failure proof PR on a `change/` branch, decide whether to make it
   a required check (change the ruleset first, then the workflow).
4. Check that the master doc "00 Huston Logic: Source of Truth" links to `docs/STATUS.md` in this repo (I cannot see the
   Google Doc).
5. Decide the AGENTS.md question from `docs/TEMPLATE.md` section E: which Huston content rules (voice, framework,
   testimonials, pricing) stay as template defaults.
6. For each new client repo made from this template, turn on "Allow auto-merge", apply the ruleset, and set the Worker
   secrets yourself. Steps: `docs/pipeline/client-onboarding-checklist.md`, `docs/SECRETS.md`,
   `docs/ruleset-protect-main.json`, `docs/LAUNCH-CHECKLIST.md` (still a stub headed "Filled in by Grant").

## For the master

- Template: the repo is now a GitHub template; client sites start from it. Auto-merge is on, behind the four required
  checks and CodeQL.
- Decision (Grant, Nov 18): the contact form's Sheet writer defaults to a Google Apps Script web app with a shared
  secret; the service-account writer stays as an option.
- Decision (Grant, Nov 18): the B7b automatic reply was made generic (no "demo" line, biography replaced by a
  placeholder, "Partner" label). `docs/website-plan.md` was not updated.
- Decision (Grant, Nov 18): CLAUDE.md, AGENTS.md, `package.json`, `wrangler.jsonc` and `.gitignore` no longer ask for
  approval; Claude may enable auto-merge only in autonomous runs and only with `--auto --squash` or `--auto --merge`.
- Decision (Grant, Nov 18): one-time waiver of the 7-day dependency rule for `@lhci/cli` 0.16.1 (below).

- Client change requests v1, steps 1 and 2 built and merged (scope check, change report), plus image privacy and alt text
  checks (#21, merged). Still to build: the agent, the Changes page, notifications, the rehearsal on Dylan's site
  and the after-live checks. The scope check is report-only in CI until it has earned "required" (item 3 above); its CI jobs are added by #22 (item 1).
- Decision (Claude, while Grant was away): the tier 1 list excludes `src/content/site.ts`, `providers.ts` and `auto-reply.ts`
  (wiring, not copy). Details and the other judgment calls: the PR description and `docs/CHANGE-SCOPE.md`.
- Decision (Claude, while Grant was away, #21): client photos must be clean of camera and location data and used
  with real alt text to pass on a `change/` branch. Calls made: a phone photo's rotation flag is kept (one EXIF block holding
  only that), because dropping it turns the picture sideways and fixing that needs re-encoding; an image used nowhere, or
  with empty ("decorative") or non-literal alt text, fails and stops for Grant rather than passing; alt text is checked for
  being real, not for being accurate (Grant reads it in the change report).

## Record: one-time exception to the 7-day dependency rule (owner-approved Nov 18)

`@lhci/cli` 0.16.1 (published 2026-11-11 23:40Z) was about 2 hours short of 7 days when PR #13 was made. Grant waived the
rule for that release only, once; its sibling `@lhci/utils` 0.16.1 came with it. Nothing else is waived:
`@playwright/test` and `overrides.playwright-core` 1.65.0 were 13 days old, and the lockfile was written with
`npx npm@12 install --package-lock-only --before=2026-11-11T23:41:00Z`, so no other package newer than the waived
release is in it. Without `--before`, npm picked about 20 transitive versions that were 1 to 6 days old.

## Record: judgment calls from the Nov 18 run

- T3b: `@type` is `Organization` (was `ProfessionalService`). Founder `jobTitle` is built but not emitted, because the
  site does not show `owner.role`. The optional `brand.logo` config key is not a launch blocker.
- T2: Wrangler allows 2,000 characters per redirect rule, so `public/_redirects` says 2,000. The checker's tests run with
  `node --test scripts/check-redirects.test.mjs` and are not wired into CI (workflows are owner-only).
- T4: `sheetTabs` stay "Submissions" / "Preview". `siteEmail` and `schedulerUrl` are `null` in the template, so the
  Worker answers 502 `config_incomplete` until they are set. CodeQL's `js/incomplete-url-substring-sanitization` alert in
  `worker/contact.test.ts` was fixed in the code, not dismissed.
- T1c: Playwright 1.65.0, not 1.65.1 (1.65.1 was 5 days old).
- Branches were made one at a time in the main checkout, not in worktrees. `gh pr merge --auto --squash` was blocked by
  the owner-only hook until #16, so the PRs before it were merged by hand.
