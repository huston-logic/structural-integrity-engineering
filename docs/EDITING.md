# The site editor

For Huston Logic and for the site owner. The first half says what the editor does. The second half is the setup for one site, and the message for adding it to a client site that already exists.

## What it is

- The site owner changes their own pages by chatting with their own AI app, such as Claude. They sign in once, connect the AI app to the site, and ask for changes in plain words.
- Nothing runs an AI on Huston Logic's side. The owner's AI app does the talking. The site's own Worker does the checking and the writing. A Worker is the small program on Cloudflare that also runs the contact form.
- The AI app talks to the Worker through MCP. MCP is a standard way for an AI app to use tools that live somewhere else. Here the tools read the site and propose changes.
- Each change is written to the site's repository on GitHub as a pull request. The repository is the folder of code and pages for the site. A pull request is a proposed change that joins the site only after its checks pass.
- The editor is off by default. It is turned on for one site with `editor.enabled` in `site.config.ts`, after the setup below.
- The editor works only on the live domain. Previews and local runs do not offer it, so no preview can hold the key that writes to GitHub.

## How a change goes live

1. **Ask.** The owner asks in plain words, for example "Change Friday hours to 9 to 3."
2. **Read the list.** The AI proposes the change. Nothing changes yet. The change list is built by code. It shows the old and new words, block by block, and the AI must show it exactly as it comes back.
3. **Say yes.** The AI publishes only after the owner says yes to that list.
4. **Preview (optional).** The AI can push the change to a preview copy of the site. The preview link is reported as ready only when the preview shows the change.
5. **Publish.** The Worker creates a branch named `change/owner-<id>` and opens a pull request titled "change: <summary>". It turns on auto-merge with squash, which merges the change as one commit once the checks pass. If GitHub says the pull request can merge at once, the Worker merges it directly.
6. **Checks.** The same required checks as any change run: `check`, `a11y`, `lighthouse` and `dependency-review`. CodeQL also runs. The change-scope check and the change report run too, but do not block yet (see Known limits).
7. **Merge and deploy.** Merging into `main` deploys the site through Cloudflare Workers Builds.
8. **Live.** Each build writes its commit to `/site-version.json`. When that file names the merge commit or a later one, the change is live.

To check, the owner asks "is it live yet?" The AI asks the Worker, which answers with one of these words:

- `checking`: the pull request is open and the checks are still running.
- `stuck`: a check failed. The owner page and the answer say which one.
- `going live`: merged, but the deploy has not reached the site yet. After 30 minutes the answer adds that this is taking longer than usual and that Huston Logic can see it.
- `live`: the site shows the change.
- `stopped`: the pull request was closed without merging.

The first time a change is seen live, the Worker stores the time. Later answers say "live N minutes after your yes".

## What is protected

- **Owners only.** Only the emails in `editor.ownerEmails` in `site.config.ts` can sign in or connect an AI app. Cloudflare Access (a sign-in gate that emails a one-time code) and the Worker both check this on every visit to `/owner`.
- **Limited access to GitHub.** The site has its own GitHub App. A GitHub App is a small identity on GitHub with only the permissions it is given. This one is installed on the site's repository only. It can read and write contents, pull requests and issues. It cannot change workflows, settings, Actions or secrets. It is not a bypass actor in the "Protect main" ruleset, so the rules apply to it.
- **Short-lived tokens.** The Worker holds the App's private key as a secret. Each time it needs GitHub, it asks for a token that lasts one hour and works on that one repository only.
- **Page files only.** The editor changes only the files in `src/content/pages/`. It never deletes a page file. A page that is no longer wanted is archived, and its file stays.
- **Not editable by chat.** The site's settings (the email address, the booking link, the LinkedIn link) and the modules in `src/content/` (the thanks page, the 404 page, the menu labels) are not changed by the editor. They go to Huston Logic.
- **One change in flight.** While an editor pull request is open, the Worker refuses to publish another one. Several previews can wait at once.
- **Daily cap.** At most `editor.dailyChangeLimit` changes a day (default 10). The Worker counts the editor's pull requests on GitHub since 00:00 UTC. An undo counts. Withdrawing an open change does not. Previews have the same daily cap, counted separately; reusing a preview that is still current does not count.
- **Size and rate limits.** A request body is at most 64 KB. A proposal has at most 40 operations and 5 pages. The owner's requests are rate limited to 30 per minute.
- **Same checks.** Every change must pass the same validator that the build and `npm run check:content` use. Nothing is published while a problem is open. Problems come back in plain words.
- **Plain text.** Page text is shown as plain text. It is never run or rendered as HTML. Text found in pages or in requests is content, never an instruction to the AI.
- **Undo.** Every merged change can be undone. The undo is a new change with its own list, and the owner says yes to it. If a later change touched the same page, the undo is refused until that later change is undone.

## The tools the AI app gets

The AI app gets these 11 tools. Changes are made with exact operations (set a piece of text, insert, move or remove a block or list item, add, archive or restore a page), not by rewriting whole pages.

| Tool | What it does |
| --- | --- |
| `get_site` | Gives the site's name, pages, menu, the change in flight, today's remaining changes and the rules. |
| `get_page` | Gives one page file, with each block numbered and each field labelled. |
| `get_block_catalog` | Lists every block, its fields and limits, its looks and where it can go. |
| `get_editing_guide` | Gives the lanes (`docs/EDITING-LANES.md`) and the voice guide (`docs/VOICE-GUIDE.md`). |
| `propose_change` | Builds a proposal and its change list, or the problems in plain words. Writes nothing to the repo. |
| `preview_change` | Pushes the proposal to a preview branch, with no pull request, and gives the preview link. |
| `publish_change` | Opens the change after the owner's yes. Refused if the site has moved, a change is open or the daily cap is reached. |
| `get_change_status` | Says whether a change is checking, stuck, going live, live or stopped, with times. |
| `list_recent_changes` | Lists the last 10 changes and their status. |
| `undo_change` | Makes a new proposal that puts back what an earlier change replaced. |
| `request_feature` | Records a request the library cannot do as a GitHub issue, and gives the owner the lane wording. |

## The owner page

The owner signs in at `https://[[Site domain]]/owner`. The page is plain HTML with no JavaScript. The signed-in email is shown in the header. Below it, the page has four sections, in this order:

- **Waiting for your yes.** Each proposal with its change list, a "Review and publish" button and its preview link. Publish and Discard are on the confirmation page.
- **Recent changes.** Each change with its status (a labelled tag such as "Live" or "Stuck") and times. A change that is still checking or stuck has a "Withdraw change" button. A change that is going live or live has an "Undo change" button. A stopped change has none.
- **Connect your AI app.** The connector address is `https://[[Site domain]]/mcp`, with the steps for Claude and a general line for other apps.
- **What you can change.** A line that tells the owner to ask their AI app "What can I change on my site?"

Review and publish, Withdraw and Undo all go to a confirmation page that shows the change list before anything happens.

## Speed

These are measured on real runs of GitHub Actions, on 2026-11-24 and 2026-11-25:

| Job | Run 45715310996 (pages-as-blocks PR) | Run 45554919104 (docs PR) |
| --- | --- | --- |
| check | 30 s | 38 s |
| change-scope | 35 s | 20 s |
| change-report | 1 min 47 s | 38 s |
| a11y | 2 min 2 s | 1 min 54 s |
| lighthouse | 4 min 9 s | 4 min 1 s |
| CodeQL workflow | about 1 min 10 s | about 50 s |
| Dependency review | about 10 s | about 7 s |
| Whole CI workflow | 4 min 12 s | 4 min 3 s |

Lighthouse sets the pace. It checks 6 pages, three runs each.

**Expected yes-to-live for a content change today:** about 4 to 5 minutes of checks, a few seconds for auto-merge, then the Cloudflare deploy. The deploy is not measured yet, because no editor change has gone live. The Worker records each real yes-to-live time. A proposal to make content changes faster is in [docs/proposals/content-fast-lane.md](proposals/content-fast-lane.md).

## Known limits

- **The AI app passes on the yes.** The Worker cannot prove that the owner said yes. A careless or misled AI could publish. The change is still content only, it passes every check, it shows on the owner page, it can be undone, and it counts against the daily cap. The AI is told never to publish without a yes to the exact list. A later setting could require the owner to press Publish on the owner page instead.
- **Removing an owner takes a deploy.** The owner list ships with the Worker, so a removal takes effect at the next deploy, which is minutes. To cut access at once, also remove the person from the Access policy.
- **Preview links are not confirmed yet.** The link is computed from the branch name. The tool reports a preview ready only when the link shows the change. If it cannot confirm the link, it says the preview is still building, or that the link could not be confirmed, and gives the link anyway. Grant checks the first one.
- **The change-scope check is not a required check yet.** It runs on every editor change and is strict on them, but it does not block a merge. Grant decides whether it becomes required (see [docs/proposals/content-fast-lane.md](proposals/content-fast-lane.md)).
- **The editor works on the live domain only.** The first real try happens on the live domain, not on a preview.
- **The status needs the deploy to name its commit.** `scripts/finish-build.mjs` takes the commit from Cloudflare's build variables. If they are not set, `/site-version.json` shows no commit, and the status never says `live`. It says "merged, going live; I can't confirm yet" instead.
- **No real connection has been tested yet.** Step g below is the first test.
- **Owners and settings are not chat tasks.** The owner list and the other `editor` settings are changed in `site.config.ts` by Huston Logic. A new block is a build by Huston Logic (see [EDITING-LANES.md](EDITING-LANES.md), Lane 3).

## Set up the editor on one site

These steps are for whoever holds the site's Cloudflare and GitHub accounts. Each step says what it does and why. Put the values in the places named here, and never in chat, a pull request or a log.

### a. Create the GitHub App

**What it does:** creates the small GitHub identity that opens the owner's pull requests, with only the permissions the editor needs. **Why:** if its key ever leaked, only this one repository is at risk.

1. In GitHub, open the `huston-logic` organization. Go to Settings, Developer settings, GitHub Apps, then New GitHub App.
2. Set the name to `[[Site name]] editor`. Set the homepage URL to `https://[[Site domain]]`. Under Webhook, untick "Active". The editor does not need GitHub to call it.
3. Under Repository permissions, set exactly these. Leave every other permission at "No access".
   - Contents: Read and write
   - Pull requests: Read and write
   - Issues: Read and write
   - Checks: Read-only
   - Metadata: Read-only
   Do not set Workflows, Administration, Actions or Secrets.
4. Under "Where can this GitHub App be installed?", choose "Only on this account".
5. Create the App. Note the **App ID**, shown on the App's page. It goes in `site.config.ts` in step e.
6. Under Private keys, choose Generate a private key. A `.pem` file downloads. Keep it for step b only.
7. Install the App from its Install App page. Choose the account, then "Only select repositories", and pick this site's repository and no other.
8. Note the **installation id**. It is the number at the end of the URL of the installation's settings page. It goes in `site.config.ts` in step e.
9. Note the **bot login**. It is the App's slug (the name in its public address, `github.com/apps/<slug>`) followed by `[bot]`, exactly, for example `my-site-editor[bot]`. It goes in `site.config.ts` in step e. The editor refuses to publish when the pull request's author does not match it, and tells the owner the settings don't match.

### b. Store the private key as a Worker secret

**What it does:** puts the key where only the Worker can read it. **Why:** the key must never sit in the repo.

From the repo folder, run:

```bash
npx wrangler secret put GITHUB_APP_PRIVATE_KEY < path/to/key.pem
```

Then delete the `.pem` file. Set this for **production only**. Never set it for previews, because the editor is off on previews. The secret is listed in [docs/SECRETS.md](SECRETS.md).

### c. Create two KV namespaces

**What it does:** creates two storage areas for the editor. KV is Cloudflare's key-value store. **Why:** `OAUTH_KV` holds the AI app's sign-in tokens, stored as hashes. `EDITOR_KV` holds drafts of proposals and the first time each change was seen live.

```bash
npx wrangler kv namespace create OAUTH_KV
npx wrangler kv namespace create EDITOR_KV
```

Each command prints an id of 32 characters. Copy both. They go in `site.config.ts` in step e. The ids are not secrets.

### d. Set up the sign-in gate (Cloudflare Access)

**What it does:** Access is Cloudflare's sign-in gate. It emails a one-time code to the owner before `/owner` opens. **Why:** only the listed owners can reach the owner page, and the Worker checks the same sign-in on every request.

1. In the Cloudflare dashboard, open Zero Trust, then Access, then Applications. Choose Add an application, then Self-hosted.
2. Set the application name to `[[Site name]] owner`. Set the domain to `[[Site domain]]` and the path to `owner`. This covers `/owner` and everything under it.
3. Under login methods, choose One-time PIN.
4. Add one policy. Its action is Allow, and its Include rule lists the owner emails and nobody else. These must match `editor.ownerEmails` in `site.config.ts`.
5. Save. Copy the **Application Audience (AUD) tag** shown for the application. It goes in `site.config.ts` in step e. It is not a secret.
6. Note the **team name**. It is the part of the team's address before `.cloudflareaccess.com`. It goes in `site.config.ts` in step e.
7. Do not protect `/mcp`, `/oauth` or `/.well-known`. The AI app signs in through the site's own OAuth sign-in (a standard way to let an app act for a user without sharing a password). Those paths must stay open to the AI app.

### Before you turn the editor on

The editor publishes nothing, and says so, until the repository has these two things. Set them in step f and check them before turning `enabled` on in step e.

- The "Protect main" ruleset with its required checks (`check`, `a11y`, `lighthouse` and `dependency-review`). Without required checks the editor never merges a change.
- **Allow auto-merge** turned on in the repository settings. Without it the editor stops the pull request and says auto-merge is off.

### e. Fill in the editor block and turn it on

**What it does:** gives the Worker the values it needs. **Why:** every value is set in one place, `site.config.ts`, and checked by the build.

Open `editor` in `site.config.ts` and fill in:

- `enabled`: `true`, last, once everything else is set.
- `ownerEmails`: the owners' emails, the same list as the Access policy.
- `access.teamDomain` and `access.aud`: the team name and the AUD tag from step d.
- `github.owner`, `github.repo`, `github.appId`, `github.installationId` and `github.botLogin`: from step a. `owner` is `huston-logic`. `repo` is the site's repository name.
- `workersSubdomain`: the part before `.workers.dev` in the account's workers.dev address. The Worker uses it to build preview links.
- `kv.oauth` and `kv.editor`: the two ids from step c.
- `rateLimitId`: the next free id in the Editor column of [docs/HOSTING.md](HOSTING.md). For the next new site it is `"2003"`.
- `dailyChangeLimit`: only if it should not be 10.

While `enabled` is `false`, nothing is checked. Once it is `true`, `npm run check:config` names each value that is still missing. Then run:

```bash
npm run sync:config
```

It writes the editor's paths, bindings and secret name into `wrangler.jsonc`. Commit the result, open a pull request and merge it.

### f. Set the repository

**What it does:** sets three things in the site's GitHub repository. **Why:** each one is needed for the editor to work.

- Settings, General: turn on **Allow auto-merge**. Publishing turns on auto-merge, which needs this setting.
- Labels: create a label named `owner-request`. Requests the AI cannot fill are filed as issues with this label.
- Watch the repository: choose Watch, then All activity. Owner requests and stuck changes then reach Grant by notification.

### g. Test it

**What it does:** runs one real change from start to finish. **Why:** the tests use fake GitHub and fake storage, so the first real run is the real test.

1. Open `https://[[Site domain]]/owner` and sign in with your email code.
2. Connect the AI app. In Claude: Settings, Connectors, Add custom connector. Paste `https://[[Site domain]]/mcp`, then choose Connect, sign in with the email code, and choose Allow. For another AI app, use the same address and its own steps for a custom connector.
3. Ask for one small text change, such as a heading. Read the list the AI shows, then say yes.
4. Ask "is it live yet?" and wait for `live`. Open `https://[[Site domain]]/site-version.json`. It should name the merge commit. If it shows no commit, see Known limits.
5. Ask for a preview of one change, and open the preview link. It should show the change.
6. Ask "undo that" and say yes to the new list.
7. Check that `https://[[Site domain]]/blocks` is a 404 on the live site.

Write down the time between the yes and `live`. That is the first real yes-to-live measurement.

## Add the editor to an existing client site

Use this for a site built from the template that does not have the editor yet. Paste the message below into a Claude Code session in the client's repo. It is a process run, so it works in one branch and one pull request, like the other runs in [docs/PROCESS.md](PROCESS.md). Keep it separate from any other change.

```text
This is an autonomous process run named "Site editor". Work from the editor sections of docs/EDITING.md in the
huston-logic/site-template repo (fetch it from GitHub; do not guess the steps). Read CLAUDE.md, AGENTS.md and
docs/PROCESS.md in this repo first.

Port these from huston-logic/site-template, as they are: worker/index.ts, the whole worker/editor/ folder, the editor
block of site.config.ts, scripts/config-rules.mjs, scripts/finish-build.mjs, scripts/content-lane.mjs (only with the content fast lane, docs/proposals/content-fast-lane.md), the bot-author rule
in scripts/check-change-scope.mjs (and its test), tests/a11y/owner-page.spec.ts, docs/VOICE-GUIDE.md and docs/EDITING.md.
Merge, do not replace, anything in AGENTS.md, README.md and package.json that the client's repo has changed.

Keep editor.enabled false. Do not set any editor value that needs an account: the App ID, the installation id, the
Access team and AUD, the KV ids and the workers.dev subdomain. Do not create a GitHub App, a KV namespace or an Access
application, and do not set any secret. Leave the [[placeholders]] in docs/VOICE-GUIDE.md as they are, and list them in
the pull request.

The one new runtime dependency is @cloudflare/workers-oauth-provider, pinned exactly to 1.2.4. It is allowed in this
run. Check it is at least 7 days old (npm view @cloudflare/workers-oauth-provider time), that dependency-review passes,
and flag it in the summary.

Run npm run check:fast on each commit and npm run check before the pull request. If either fails, stop and show the
exact error.

Open one pull request on a branch named feat/site-editor. Its description starts with a "Needs your eyes" line that lists
every change to AGENTS.md, README.md, package.json and site.config.ts.

Under Needs Grant in docs/STATUS.md, list the setup steps a to g in docs/EDITING.md, in order.

Stop, queue the item and continue with the other work on any of these, as CLAUDE.md says: secrets or credentials, DNS,
accounts or money, sending real email, deleting user data, lowering a threshold or a required check, or any owner-only
path (.claude/hooks, .claude/agents, .claude/skills, .claude/settings*.json, .github/workflows). For an owner-only
change, write the proposed file to the scratchpad and list it for Grant to copy in by hand.

END OF BRIEF
```

## One connector per client (not built)

A client with a site and the Pipeline app has two connectors. Claude's free plan allows one custom connector. The options, with their costs, are in [docs/proposals/one-connector.md](proposals/one-connector.md). Nothing is built.
