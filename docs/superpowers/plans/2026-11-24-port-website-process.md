# Port the website process

Date: 2026-11-24. Kind of run: process run, one branch (`chore/port-website-process`), one PR. Brief approved by Grant;
brainstorming skipped. Executed inline (`superpowers:executing-plans`); a Haiku subagent only for reading and docs.

**Goal:** bring this repo in line with `huston-logic/site-template`'s new build process (template commit `99e5378`).

**Source of truth:** the template's `main`, cloned read-only into the scratchpad. Never edited.

**Out of scope:** site content, copy, photos, `site.config.ts`. No test removed, no assertion weakened, no threshold
lowered, no change to which checks are required.

## Preflight (done)

The template has `docs/PROCESS.md`, `scripts/check-process.mjs`, `check:fast` in `package.json`, the agents `scout` and
`docs-writer`, and `"precommitHookFastOnly": true` in `scripts/process-rules.json`. Nothing missing.

Found: this repo's hooks and `settings.json` have no change the template lacks. The template only adds
`prepush-check.mjs`, the `check:fast` pre-commit hook, new selftest cases, two agents and the hooks README text.
Dependabot PR #1 is closed (its bump landed as #16), so its Needs Grant item is no longer open.

## Tasks

1. **Scripts.** Copy `scripts/check-process.mjs`, `scripts/check-process.test.mjs` and `scripts/process-rules.json`
   (flag set to `false` until the owner batch). In `package.json` add `check:process` and `check:fast`; make `check` run
   `check:fast` then `build`. `check:fast` keeps every step `check` has today (config, lint, typecheck, test:worker,
   test:scripts) and adds `check:process`. Do not touch the `overrides` or `description`.
   *Done when:* `npm run check:process` passes (6 rules, 1 off) and `npm run check` runs the same steps as before plus
   `check:process`.
2. **Lighthouse.** `numberOfRuns` 5 to 3 in `lighthouserc.cjs`, and the comment that says "5 runs" to "3 runs". No
   threshold or assertion changes (approved by Grant).
3. **`docs/PROCESS.md`.** Copy the template's file. One line under the title: "This file follows
   huston-logic/site-template docs/PROCESS.md as of 99e5378. Change the template first, then port." Replace Timings with
   this repo's own before and after.
4. **`docs/LAUNCH-CHECKLIST.md`.** Copy the template's.
5. **`CLAUDE.md`.** Replace "Autonomous runs" with the template's version. Update every line that says the full check
   runs on each commit (Git workflow, Decision authority "Local checks", Commands). Keep everything specific to this site.
6. **`docs/STATUS.md`.** Keep current state, Needs Grant (every open item and every copy question), For the master and
   the last run, at most 150 lines. Move the older changelog unchanged to `docs/history/STATUS-history.md`.
7. **`docs/pipeline/README.md`.** One line at the top saying it is a copy of the template's handbook and the
   template's copy is the truth. Nothing else changes.
8. **Owner-only files.** For each file under `.claude/hooks`, `.claude/agents` and `.claude/settings.json` that differs
   from the template, write the template's version as `<file>.proposed` in the scratchpad (CLAUDE.md: owner-only paths go
   to the scratchpad). Write one batch script, `owner-batch.sh`, that makes `chore/owner-fast-hooks`, copies them in,
   sets `precommitHookFastOnly` to `true`, then runs the hook selftest, `npm run check:process` and `npm run check`.
   List any repo-only hook or settings change (none found).
9. **Closing.** Run the full `npm run check`, then the review pass once on the whole branch, then open the PR and queue
   auto-merge (`gh pr merge <number> --auto --squash`). STATUS.md gets this run's timing table and the batch steps under
   Needs Grant, and "For the master" gets: "This repo now follows the site template's docs/PROCESS.md."

## Judgment calls

- `.proposed` files and the batch script sit in the scratchpad, as CLAUDE.md says for owner-only changes. The scratchpad
  can be cleared by a reboot; if it is, the batch needs the template re-cloned and the files re-copied.
- The pre-commit hook still runs the full check until the batch lands (rule 4 is only half switched on).
- `docs/PROCESS.md` rule text is copied verbatim; only the header line and the Timings change.

## Timings: "before" (measured first, `.next` deleted, Grant's Mac)

| Step | Time |
|---|---|
| `check:config` | 0.2 s |
| `lint` | 3.1 s |
| `typecheck` | 2.0 s |
| `test:worker` | 0.4 s |
| `test:scripts` | 4.8 s |
| `build` | 5.6 s |
| `npm run check` as one command | 16.1 s |
