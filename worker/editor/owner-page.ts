// The owner page and the sign-in consent page: pure functions, data in and an HTML string out. No scripts, no external
// resources, no style attributes. Every interpolated value goes through escapeHtml.

import { escapeHtml } from "../html.ts";
import type { ChangeView, ProposalView } from "./views.ts";
import { AGENCY_NAME } from "./words.ts";

export type { ChangeView, ProposalView };

export interface ThemeColors {
  white: string;
  ink: string;
  ink2: string;
  silver: string;
  silver2: string;
  green: string;
  greenDeep: string;
  rust: string;
  line: string;
  tint: string;
}

export interface PageBase {
  siteName: string;
  siteUrl: string;
  email: string;
  theme: ThemeColors;
}

export interface HomeData extends PageBase {
  /** null when the list could not be read. */
  proposals: ProposalView[] | null;
  changes: ChangeView[] | null;
}

export interface ConfirmData extends PageBase {
  proposal: ProposalView;
}

export interface ConsentData extends PageBase {
  handle: string;
  clientName: string;
  clientDomain?: string;
  redirectHost: string;
  redirectIsLoopback: boolean;
}

export interface MessageData extends PageBase {
  title: string;
  body: string;
}

const e = escapeHtml;

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const safeColor = (value: string, fallback: string): string => (HEX.test(value) ? value : fallback);

/** `2026-01-01 12:00 UTC`, the same everywhere. */
export function formatTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return `${new Date(ms).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

const time = (iso: string): string => `<time datetime="${e(iso)}">${e(formatTime(iso))}</time>`;

function styles(theme: ThemeColors): string {
  const c = (key: keyof ThemeColors, fallback: string): string => safeColor(theme[key], fallback);
  const ink = c("ink", "#1c1917");
  const line = c("line", "#d6d3d1");
  const ink2 = c("ink2", "#44403c");
  const white = c("white", "#ffffff");
  return `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:${white};color:${ink};font:1.0625rem/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:40rem;margin:0 auto;padding:0 1rem}
header{border-bottom:1px solid ${line};padding:1rem 0}
header p{margin:0}
.muted{color:${ink2}}
h1{font-size:1.625rem;line-height:1.25;margin:1.5rem 0 1rem}
h2{font-size:1.25rem;line-height:1.3;margin:2rem 0 .75rem}
h4{font-size:.9375rem;line-height:1.3;margin:.75rem 0 0}
a{color:${ink};text-decoration:underline;text-underline-offset:.15em}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid ${c("rust", "#9a3412")};outline-offset:2px}
.skip{position:absolute;left:-999px;top:0;background:${white};padding:.75rem 1rem;z-index:1}
.skip:focus{left:0}
main{padding-bottom:3rem}
ul,ol{padding:0;margin:0}
.card{border:1px solid ${line};border-radius:8px;padding:1rem;margin:0 0 1rem;list-style:none}
.card h3{font-size:1.0625rem;margin:0 0 .5rem}
.card p{margin:.25rem 0}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:${c("silver", "#f5f5f4")};border:1px solid ${line};border-radius:8px;padding:.75rem;margin:.75rem 0;font:.9375rem/1.45 ui-monospace,SFMono-Regular,Menlo,monospace}
code{overflow-wrap:anywhere;background:${c("silver", "#f5f5f4")};border:1px solid ${line};border-radius:4px;padding:.1rem .35rem;font-size:.9375rem}
.actions{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0 0}
.actions form{margin:0}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:.75rem 1.25rem;border-radius:8px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;border:1px solid ${ink2};background:${white};color:${ink}}
.nav-link{display:inline-flex;align-items:center;min-height:44px}
.tag{display:inline-block;border:1px solid ${ink2};border-radius:999px;padding:.125rem .625rem;font-size:.875rem;font-weight:600;background:#ffffff;color:${ink}}
.btn.primary{background:${c("green", "#1e4fa3")};border-color:${c("green", "#1e4fa3")};color:${white}}
.btn.primary:hover{background:${c("greenDeep", "#173b7a")}}
.host{font-size:1.25rem;font-weight:700;overflow-wrap:anywhere}
.warn{border:2px solid ${c("rust", "#9a3412")};border-radius:8px;padding:.75rem;margin:1rem 0}
`;
}

function layout({ title, siteName, email, theme, body }: { title: string; siteName: string; email?: string; theme: ThemeColors; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${e(title)} | ${e(siteName)}</title>
<style>${styles(theme)}</style>
</head>
<body>
<a class="skip" href="#main">Skip to main content</a>
<header>
<div class="wrap">
<p><strong>${e(siteName)}</strong> <span class="muted">Owner page</span></p>
${email ? `<p class="muted">Signed in as ${e(email)}</p>` : ""}
</div>
</header>
<main id="main">
<div class="wrap">
${body}
</div>
</main>
</body>
</html>
`;
}

const wrap = (base: PageBase, title: string, body: string): string => layout({ title, siteName: base.siteName, email: base.email, theme: base.theme, body });

function postForm(action: string, fields: Record<string, string>, label: string, primary: boolean): string {
  const hidden = Object.entries(fields)
    .map(([name, value]) => `<input type="hidden" name="${e(name)}" value="${e(value)}">`)
    .join("");
  return `<form method="post" action="${e(action)}">${hidden}<button class="btn${primary ? " primary" : ""}" type="submit">${e(label)}</button></form>`;
}

const STATE_WORDS: Record<ChangeView["state"], string> = {
  checking: "Being checked, not live yet",
  stuck: "Stuck: a check found a problem, not live",
  "going live": "Passed its checks, going live",
  live: "Live",
  stopped: "Stopped before it went live",
  unknown: "Status unavailable right now",
};

const STATE_TAGS: Record<ChangeView["state"], string> = {
  checking: "Checking",
  stuck: "Stuck",
  "going live": "Going live",
  live: "Live",
  stopped: "Stopped",
  unknown: "Status unavailable",
};

/** The button on a published change: a change still open is withdrawn, a merged one is undone, a stopped one has nothing to do. */
function changeAction(change: ChangeView): string {
  switch (change.state) {
    case "checking":
    case "stuck":
      return `Withdraw change ${change.change}`;
    case "going live":
    case "live":
      return `Undo change ${change.change}`;
    case "stopped":
    case "unknown":
      return "";
  }
}

function previewLink(proposal: ProposalView): string {
  return proposal.previewLink
    ? `<a class="btn" href="${e(proposal.previewLink)}" target="_blank" rel="noopener noreferrer" aria-label="Open the preview (opens in a new tab): ${e(proposal.summary)}">Open the preview (opens in a new tab)</a>`
    : "";
}

function proposalCard(proposal: ProposalView): string {
  const links = [
    `<a class="btn primary" href="/owner/publish?proposal=${encodeURIComponent(proposal.id)}" aria-label="Review and publish: ${e(proposal.summary)}">Review and publish</a>`,
    previewLink(proposal),
  ].join("");
  return `<li class="card">
<h3>${e(proposal.summary)}</h3>
<p class="muted">Prepared ${time(proposal.createdAt)}</p>
<h4>Changes in this proposal</h4>
<pre>${e(proposal.changeList)}</pre>
<div class="actions">${links}</div>
</li>`;
}

function changeItem(change: ChangeView): string {
  const times =
    change.state === "live" && change.liveAt
      ? `Published ${time(change.publishedAt)}, live ${time(change.liveAt)}.`
      : `Published ${time(change.publishedAt)}.`;
  const failed = change.state === "stuck" && change.failedChecks && change.failedChecks.length > 0 ? `<p>Failed: ${e(change.failedChecks.join(", "))}</p>` : "";
  const label = changeAction(change);
  const action = label ? postForm("/owner/undo", { change: String(change.change) }, label, false) : "";
  return `<li class="card">
<h3>Change ${e(String(change.change))}: ${e(change.title)}</h3>
<p><span class="tag">${e(STATE_TAGS[change.state])}</span></p>
<p>${e(STATE_WORDS[change.state])}</p>
<p class="muted">${times}</p>
${failed}
${action ? `<div class="actions">${action}</div>` : ""}
</li>`;
}

export function renderOwnerHome(data: HomeData): string {
  const waiting =
    data.proposals === null
      ? `<p>The waiting list could not be loaded right now. Try again in a minute.</p>`
      : data.proposals.length === 0
        ? `<p>Nothing is waiting.</p>`
        : `<ul class="list" role="list">${data.proposals.map(proposalCard).join("\n")}</ul>`;
  const recent =
    data.changes === null
      ? `<p>The list of changes could not be loaded right now. Try again in a minute.</p>`
      : data.changes.length === 0
        ? `<p>No changes yet.</p>`
        : `<ol class="list" role="list">${data.changes.map(changeItem).join("\n")}</ol>`;
  const body = `<h1>Your site</h1>
<h2>Waiting for your yes</h2>
${waiting}
<h2>Recent changes</h2>
${recent}
<h2>Connect your AI app</h2>
<p>The connector address is <code>${e(data.siteUrl)}/mcp</code></p>
<p>For Claude: Settings, Connectors, Add custom connector, paste the address, Connect, sign in with the code sent to your email, then Allow.</p>
<p>Other AI apps that support connectors with sign-in work the same way.</p>
<h2>What you can change</h2>
<p>Ask your AI app: \u201CWhat can I change on my site?\u201D It will tell you what you can change by chatting, and what needs ${e(AGENCY_NAME)}.</p>`;
  return wrap(data, "Owner page", body);
}

export function renderConfirm(data: ConfirmData): string {
  const p = data.proposal;
  const body = `<h1>Publish this change?</h1>
<p>${e(p.summary)}</p>
<h2>Changes in this proposal</h2>
<pre>${e(p.changeList)}</pre>
<div class="actions">
${postForm("/owner/publish", { proposal: p.id }, "Publish", true)}
${postForm("/owner/discard", { proposal: p.id }, "Discard", false)}
${previewLink(p)}
</div>
<p><a class="nav-link" href="/owner">Back to the owner page</a></p>`;
  return wrap(data, "Publish this change?", body);
}

export function renderConsent(data: ConsentData): string {
  const title = `Allow ${data.clientName} to edit ${data.siteName}?`;
  const domain = data.clientDomain ? `<p>Its verified domain is <strong>${e(data.clientDomain)}</strong>.</p>` : "";
  const warn = data.redirectIsLoopback
    ? `<p class="warn"><strong>Warning:</strong> this sends your sign-in to an app running on this computer. Only continue if you started it yourself.</p>`
    : "";
  const body = `<h1>${e(title)}</h1>
<p class="host">It will send its sign-in to ${e(data.redirectHost)}.</p>
${domain}
${warn}
<p>It can read your pages and propose changes. Nothing goes live until you say yes in the chat.</p>
<form method="post" action="/owner/connect">
<input type="hidden" name="handle" value="${e(data.handle)}">
<div class="actions">
<button class="btn primary" type="submit" name="decision" value="allow">Allow</button>
<button class="btn" type="submit" name="decision" value="deny">Don't allow</button>
</div>
</form>`;
  return wrap(data, title, body);
}

export function renderMessage(data: MessageData): string {
  const body = `<h1>${e(data.title)}</h1>
<p>${e(data.body).replace(/\n/g, "<br>")}</p>
<p><a class="nav-link" href="/owner">Back to the owner page</a></p>`;
  return wrap(data, data.title, body);
}
