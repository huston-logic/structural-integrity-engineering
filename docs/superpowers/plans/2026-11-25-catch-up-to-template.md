# Plan: Catch up to the template (process run, 2026-11-25)

Brief: Grant's "Catch up to the template". Bring this site up to `huston-logic/site-template` so the site editor can be
turned on later. Everything stays off. No visible change to any page in any step.

## How the ports are taken

The template's `main` already holds all five features on top of each other (blocks, editor, uploads, collections,
forms). Its files at `main` import code from later features, so a step that copies "the whole folder" from `main` would
pull in the later steps. Each step therefore copies the template **as it was when that feature merged**:

| Step | Branch | Template commit |
|---|---|---|
| 1. Pages as blocks (+ the leftovers PR) | `chore/pages-as-blocks` | `eb7f06c` (#29 `f1e0e7d`, #30) |
| 3. Site editor | `feat/site-editor` | `603643a` (#31) |
| 4a. Uploads and photos | `feat/uploads` | `8bbc73b` (#32) |
| 4b. Collections and brand, with step 2 (move content) | `feat/collections-and-brand` | `0cb5018` (#33) |
| 4c. Forms and downloads | `feat/forms-and-downloads` | `8c49fcd` (#35) |
| 5. Hosting docs and the Pipeline destination | `docs/hosting-and-pipeline` | `main` (#27, #28) |

Step 2 ("Move blog posts, videos, testimonials, team, business details and brand") needs `business.json`,
`brand.json`, `src/brand/fonts.ts` and the `sync:config` palette writer, which only arrive with the collections port.
It is done inside step 4b.

## Site differences kept on purpose

This site's addresses match Dylan's old Wix site, so they do not change. The template assumes `/contact` and one-level
page paths. The ports keep two small differences, each in one place, and list them in `docs/SITE-DIFFERENCES.md`
(new; every later port re-applies what it lists):

1. **Contact page path.** The contact page is `/contact-us` and the thanks page `/contact-us/thanks`. Every template
   literal `/contact`, `/contact/thanks` and `/contact#book` is read from one constant.
2. **Two-level page paths.** `/services/residential-structural-design` and its two siblings are page files. A `/` in a
   path is `--` in the file name (`services--residential-structural-design.json`); `--` cannot occur in a slug, so the
   mapping is exact. The page route is a catch-all (`[...slug]`).

Both are candidates to bring back to the template (template first, then port).

## The gate for every step

- Build `main` first and keep `out/` outside the repo as the before picture.
- After the change: `npm run build`, `npm run report:changes -- --base-out <before>`, `npm run compare:screens`.
  Every page at 390 and 1440 wide must say `identical` (tolerance 2 only for glow noise, said in the PR).
- `npm run check:fast` on every commit, `npm run check` before the PR. No threshold, test or rule is weakened.

## Rules for every step

- `editor.enabled` false, uploads off. No GitHub App, KV, R2, Access, DNS or secret. No account values.
- Site sections are site blocks in `src/site-blocks/`, registered as they are. Library blocks read this site's tokens;
  one that looks off-brand is listed, not restyled.
- Owner-only paths are written to the scratchpad as proposals.
- Opus plans and reviews; Sonnet implements; Haiku reads and writes docs.
- One PR per step, auto-merge queued with `gh pr merge <n> --auto --squash` after the end review; the next step starts
  from an updated `main` after the merge.

## Close

`docs/STATUS.md`: what was ported, the timing table, For the master lines, and under Needs Grant the editor setup steps
a to l and the content fast lane, with this site's names filled in.
