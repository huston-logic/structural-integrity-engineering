import { siteConfig } from "../../site.config.ts";
import { confirmation } from "./contact-fields.ts";

/**
 * The automatic reply the contact Worker sends, as HTML and plain text with the same words. The words are the copy deck's
 * "After sending" line (`confirmation` in contact-fields.ts); there is no booking link and no visitor input in it at all.
 * The signature (names, email, domain, tagline) and the inline colors come from site.config.ts. This module imports only
 * import-free files, because the Worker bundles it.
 */

/** In the site's voice; Grant approves these two lines in the PR. */
const replyGreeting = "Hello,";
const replySignoff = "Talk soon,";

/** The slice of site.config.ts the reply reads. A structural type, so tests can pass a fixture. */
export interface AutoReplyConfig {
  business: { name: string; tagline: string };
  owner: { name: string; role: string };
  domain: { url: string };
  contact: { siteEmail: string | null };
  theme: { colors: { night: string; dusk: string; duskDeep: string; rule: string; mist: string } };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** "https://example.com/" becomes "example.com". */
function displayHost(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/** Builds the reply content. It never throws: placeholder or null config values just show up as text (or are left out). */
export function buildAutoReply(config: AutoReplyConfig) {
  const { business, owner, domain, contact, theme } = config;
  // The email is read on a light background, so it takes the darker tokens: night text, rule (6:1 on white) for the
  // quieter lines, dusk links, the tagline in dusk-deep and a mist separator. Amber and snow are for the dark site and
  // would fail contrast on white.
  const t = theme.colors;
  const c = { ink: t.night, ink2: t.rule, green: t.dusk, rust: t.duskDeep, line: t.mist };
  const email = contact.siteEmail;
  const host = displayHost(domain.url);
  const role = `${owner.role}, ${business.name}`;
  const link = `color:${escapeHtml(c.green)};text-decoration:none;`;
  const contactLinks = [
    ...(email ? [`<a href="mailto:${escapeHtml(email)}" style="${link}">${escapeHtml(email)}</a>`] : []),
    `<a href="${escapeHtml(domain.url)}" style="${link}">${escapeHtml(host)}</a>`,
  ].join(`<span style="color:${escapeHtml(c.line)};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`);

  return {
    subject: confirmation.subject,
    /** A greeting with no name (the reply holds no visitor input) and a short sign-off above the signature. */
    greeting: replyGreeting,
    paragraphs: [`${confirmation.heading} ${confirmation.body}`],
    signoff: replySignoff,
    /** Colors for the wrapper in worker/messages.ts: body text and links. */
    colors: { ink: c.ink, link: c.green },
    /** Inline styles only. */
    signatureHtml:
      `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:${escapeHtml(c.ink)};"><tr><td style="border-left:3px solid ${escapeHtml(c.green)};padding:2px 0 2px 12px;">` +
      `<div style="font-size:15px;font-weight:bold;line-height:20px;color:${escapeHtml(c.ink)};">${escapeHtml(owner.name)}</div>` +
      `<div style="font-size:13px;line-height:18px;color:${escapeHtml(c.ink2)};">${escapeHtml(role)}</div>` +
      `<div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:20px;color:${escapeHtml(c.rust)};padding-top:4px;">${escapeHtml(business.tagline)}</div>` +
      `<div style="font-size:13px;line-height:18px;padding-top:6px;">${contactLinks}</div>` +
      "</td></tr></table>",
    signatureText: [
      owner.name,
      role,
      business.tagline,
      email ? `${email} | ${host}` : host,
    ],
  };
}

export type AutoReply = ReturnType<typeof buildAutoReply>;

/** The reply built from the real config. */
export const autoReply = buildAutoReply(siteConfig);
