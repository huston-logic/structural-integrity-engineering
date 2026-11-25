# Status history: structural-integrity-engineering

Older parts of `docs/STATUS.md`, moved here unchanged by the 2026-11-24 "Port the website process" run. The live file keeps
only the current state, Needs Grant, For the master and the last run.

## Changelog

- 2026-11-23: repo made from site-template; `docs/PLAN.md` and this file reset for the site build.
- 2026-11-23/24: autonomous run. PRs #2 (client config), #3 (booking link and LinkedIn may be "none"), #4 (design
  system), #5 (photos), #6 (home page), #7 (routes), #8 (/services), #9 (service pages), #10 (about), #11 (contact),
  #12 (SEO and finish), #13 (gzip in `scripts/preview.mjs`, approved by Grant, opened by the main session), #14
  (visual polish). This PR closes the run.

## Open items as of the end of the Nov 23-24 autonomous run

- **Open:** Dependabot PR #1 only (Grant is handling it).
- Needs Grant item 9: Dependabot PR #1.

## Last run of the 2026-11-24 "Port the website process" run (moved here unchanged by "Feedback round 1")

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
