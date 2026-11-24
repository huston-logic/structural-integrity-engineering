import { siteConfig } from "../../site.config.ts";
import { NONE } from "../lib/optional-setting.ts";

/**
 * The automatic reply the contact Worker sends (docs/website-plan.md B7b), as HTML and plain text with the same words.
 * The signature (names, email, domain, tagline) and the inline colors come from site.config.ts; the body below is the
 * copy to edit for each client. This module imports only the import-free config, because the Worker bundles it.
 * worker/messages.ts fills `{firstName}` and `{bookingUrl}`; the first name is the only visitor input in the email.
 */

/** The slice of site.config.ts the reply reads. A structural type, so tests can pass a fixture. */
export interface AutoReplyConfig {
  business: { name: string; tagline: string };
  owner: { name: string; role: string };
  domain: { url: string };
  /** `schedulerUrl` is a URL, "none" (no booking link: the reply leaves the booking parts out) or null (not set yet). */
  contact: { siteEmail: string | null; schedulerUrl: string | null };
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
  const hasBooking = contact.schedulerUrl !== NONE;
  const role = `${owner.role}, ${business.name}`;
  const link = `color:${escapeHtml(c.green)};text-decoration:none;`;
  const contactLinks = [
    ...(email ? [`<a href="mailto:${escapeHtml(email)}" style="${link}">${escapeHtml(email)}</a>`] : []),
    `<a href="${escapeHtml(domain.url)}" style="${link}">${escapeHtml(host)}</a>`,
  ].join(`<span style="color:${escapeHtml(c.line)};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`);

  return {
    subject: "I got your note. Here's what happens next.",
    greeting: "Hi {firstName},",
    greetingNoName: "Hi there,",
    paragraphs: [
      "You reached out! That's the first step, and thanks for taking it. This reply is automatic.",
      "The next reply is from me. I read every message myself and write back within one business day.",
    ],
    /** "{before}{linkText}{after}": the link text is the booking link in HTML; in plain text the URL follows on its own line. */
    booking: hasBooking
      ? {
          before: "If you'd rather talk, ",
          linkText: "pick a time for a free 20-minute call",
          after: ".",
        }
      : null,
    paragraphsAfter: [
      "[[A short paragraph about how you work, for the automatic reply]]",
      "If there's more you want me to know, reply to this email. It comes straight to me. Please leave out passwords and client details. Anything sensitive gets handled the right way, later.",
    ],
    talkSoon: "Talk soon,",
    /** Colors for the wrapper in worker/messages.ts: body text and links. */
    colors: { ink: c.ink, link: c.green },
    /** Inline styles only; `{bookingUrl}` is filled from the booking link in config. */
    signatureHtml:
      `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:${escapeHtml(c.ink)};"><tr><td style="border-left:3px solid ${escapeHtml(c.green)};padding:2px 0 2px 12px;">` +
      `<div style="font-size:15px;font-weight:bold;line-height:20px;color:${escapeHtml(c.ink)};">${escapeHtml(owner.name)}</div>` +
      `<div style="font-size:13px;line-height:18px;color:${escapeHtml(c.ink2)};">${escapeHtml(role)}</div>` +
      `<div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;line-height:20px;color:${escapeHtml(c.rust)};padding-top:4px;">${escapeHtml(business.tagline)}</div>` +
      `<div style="font-size:13px;line-height:18px;padding-top:6px;">${contactLinks}</div>` +
      (hasBooking
        ? `<div style="font-size:13px;line-height:18px;padding-top:2px;"><a href="{bookingUrl}" style="${link}font-weight:bold;">Book a free 20-minute call &rarr;</a></div>`
        : "") +
      `<div style="font-size:12px;line-height:17px;color:${escapeHtml(c.ink2)};padding-top:10px;">Changed your mind? Reply &ldquo;no thanks&rdquo; and I won&rsquo;t write again.</div>` +
      "</td></tr></table>",
    signatureText: [
      owner.name,
      role,
      business.tagline,
      email ? `${email} | ${host}` : host,
      ...(hasBooking ? ["Book a free 20-minute call: {bookingUrl}"] : []),
      "",
      'Changed your mind? Reply "no thanks" and I won\'t write again.',
    ],
  };
}

export type AutoReply = ReturnType<typeof buildAutoReply>;

/** The reply built from the real config. */
export const autoReply = buildAutoReply(siteConfig);
