# Secrets and settings for the contact form

Every secret and public setting the contact form uses, in one place. **Names and places only, never values.** The site owner sets
every secret personally, in their own Terminal or in the Cloudflare and Google dashboards. Claude, CI and the repo never see them,
and nothing here should be pasted into chat, a pull request, an issue or a log.

Which Google Sheet writer you use decides which Worker secrets you need. It is one setting, `contact.sheetWriter` in
`site.config.ts`:

- `"apps-script"` (the default): the Worker posts each row to a small Google Apps Script web app that you own
  (`docs/apps-script/contact-sheet.gs`). No Google Cloud project is needed.
- `"service-account"`: the Worker signs in to Google as a service account and writes through the Sheets API.

After changing `sheetWriter`, run `npm run sync:config` and commit the result. It rewrites the `secrets.required` list in
`wrangler.jsonc` to match, and a deploy fails while a listed secret is missing.

## Worker secrets

| Name | What it is | Needed by | Production | Preview |
| --- | --- | --- | --- | --- |
| `RESEND_API_KEY` | Resend API key, "Sending access" for the site's domain only. Sends the notification and the automatic reply. | Both writers | `npx wrangler secret put RESEND_API_KEY` | `npx wrangler preview base-config secret put RESEND_API_KEY` |
| `TURNSTILE_SECRET_KEY` | The secret key of the site's Cloudflare Turnstile widget. | Both writers | `npx wrangler secret put TURNSTILE_SECRET_KEY` | `npx wrangler preview base-config secret put TURNSTILE_SECRET_KEY` |
| `SHEET_WEBHOOK_URL` | The Apps Script web-app URL (starts with `https://script.google.com/`). | `apps-script` | `npx wrangler secret put SHEET_WEBHOOK_URL` | `npx wrangler preview base-config secret put SHEET_WEBHOOK_URL` |
| `SHEET_WEBHOOK_SECRET` | The shared secret the Worker sends and the Apps Script checks. Make it long and random. Must equal the Script Property `SHEET_SECRET`. | `apps-script` | `npx wrangler secret put SHEET_WEBHOOK_SECRET` | `npx wrangler preview base-config secret put SHEET_WEBHOOK_SECRET` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The whole service-account JSON key file. | `service-account` | `npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_KEY < path/to/key.json` | `npx wrangler preview base-config secret put GOOGLE_SERVICE_ACCOUNT_KEY < path/to/key.json` |
| `GOOGLE_SHEET_ID` | The Sheet ID (between `/d/` and `/edit` in its URL). | `service-account` | `npx wrangler secret put GOOGLE_SHEET_ID` | `npx wrangler preview base-config secret put GOOGLE_SHEET_ID` |

Run each command from the repo folder. It asks for the value with hidden input, so the value never appears on screen or in your
shell history.

- **Previews do not share production secrets.** Set the same names for previews with the `preview base-config` commands, with the
  same values. A preview copies the base secrets **when it is created**, so set them before pushing a branch; later changes do not
  reach existing previews.
- To fix one existing preview, also set the secret on it: `npx wrangler preview secret put <NAME> --name <branch-name>` (this
  creates a new deployment of that preview).
- List names only, never values: `npx wrangler secret list` (production), `npx wrangler preview base-config secret list` (new
  previews), `npx wrangler preview secret list --name <branch-name>` (one preview).
- Each `secret put` creates a new production version (a row in Deployments). If it fails with "latest version of your Worker isn't
  currently deployed", use the dashboard instead: Workers & Pages, your Worker, Settings, Variables and Secrets.
- Previews write to the Sheet's `Preview` tab and email only the site's own address, so preview secrets can be the same as
  production ones.

## Apps Script Script Properties (`apps-script` writer only)

Set in the Apps Script editor: Project Settings, Script properties. These are not Worker secrets and they live in Google, not in
this repo.

| Property | Required | What it is |
| --- | --- | --- |
| `SHEET_SECRET` | Yes | The shared secret. Must equal the Worker secret `SHEET_WEBHOOK_SECRET`. While it is unset the script refuses every request. |
| `TAB_PRODUCTION` | No | Tab for live submissions. Defaults to `Submissions`, which is `contact.sheetTabs.production` in `site.config.ts`. |
| `TAB_PREVIEW` | No | Tab for branch previews. Defaults to `Preview`, which is `contact.sheetTabs.preview` in `site.config.ts`. |

If you rename a tab in `site.config.ts`, set the matching property here and rename the tab in the Sheet.

## Public settings (not secrets)

| Name | What it is | Where |
| --- | --- | --- |
| `contact.turnstileSiteKey` | The Turnstile widget's **site key**. It ships in the page, so it is public by design. The matching secret key is the Worker secret above. | `site.config.ts` |
| `NEXT_PUBLIC_SITE_URL` | The site's public address, used for canonical URLs, Open Graph, the sitemap and JSON-LD. A build variable, not a secret. | `.env.example` shows the name; set it in the Cloudflare build settings. Falls back to `domain.url` in `site.config.ts`. |
| Rate-limit namespace ids | `contact.rateLimit.namespaceIds` in `site.config.ts`. Any integer string, unique per Cloudflare account. | `site.config.ts`, then `npm run sync:config` |

`NEXT_PUBLIC_*` variables are readable by anyone who visits the site. Never put a secret in one.

## Local testing values (published by Cloudflare, not secrets)

Cloudflare publishes Turnstile test keys. They are safe to use locally and to write in docs:

| Value | Meaning |
| --- | --- |
| Site key `1x00000000000000000000AA` | Always passes. The form uses it on localhost. |
| Secret key `1x0000000000000000000000000000000AA` | Always passes. Use as `TURNSTILE_SECRET_KEY` for `wrangler dev`. |
| Secret key `2x0000000000000000000000000000000AA` | Always fails. Use it to see the "couldn't verify" error. |

The README's "Local test of the Worker" section has the full `wrangler dev` command. In development mode the Worker sends no email
and writes no row, so the other secrets can be dummy values such as `x`.

## Never commit

- `.dev.vars` and `.dev.vars.*` (wrangler's local secrets file) and every `.env*` file except `.env.example`. They are git-ignored.
  If a command would stage one, stop.
- Service-account key files (`*.json` downloaded from Google Cloud), API keys, the Apps Script web-app URL, or the shared secret.
  The web-app URL is treated as a secret because anyone holding it and the shared secret can write rows.
- Real values in any doc, test, comment or pull request. Tests use obviously fake values and a mocked `fetch`.
- Anything sensitive in a `NEXT_PUBLIC_*` variable.
