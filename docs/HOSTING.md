# Hosting register

How hosting works: `docs/PROCESS.md`, rule 13. Rate-limit ids: rule 14. Moving a client out: `docs/OFFBOARDING.md`.

## Rate-limit ids

Rate-limit bindings with the same `namespace_id` in one Cloudflare account share their counters, even across Workers
(Cloudflare docs, "Rate Limiting" binding). So every site has its own pair of ids. They are two whole numbers written as
strings: `contact.rateLimitIds` `{ production, preview }` in `site.config.ts` (`npm run sync:config` copies them into
`wrangler.jsonc`). `npm run check:config` refuses a missing pair, a pair with the same number twice, and a site that
still uses the template's 1001 and 1002.

**To give a new site its ids:** take the next free pair below, starting at 2001/2002, then add a row in the same PR.

| Site | Production | Preview | Notes |
|---|---|---|---|
| This template | 1001 | 1002 | Only for the template itself. A site made from it must change them. |
| Grant's site | 1001 | 1002 | Taken. |
| Dylan's site (structural-integrity-engineering) | 2201 | 2202 | Taken. Chosen when the site was built, outside the 2001 sequence. No editor id yet (the site editor is not set up). |
| Pipeline app copies | picked at install | picked at install | The Pipeline app picks its own ids when a copy is installed. Do not assign them here. |
| (next new site) | 2001 | 2002 | Next free pair. |

Grant's site was built before the register existed and uses 1001/1002. Once it runs in the same Cloudflare account as
another site, move it to a new pair and update its row.

## Offboarded sites

When a client is moved out (`docs/OFFBOARDING.md`), add a row with the handover date. Huston Logic's liability ends on
that date. Release the site's ids in the table above in the same PR.

| Site | Handover date | Ids released |
|---|---|---|
| (none yet) | | |
