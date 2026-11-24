import { needOptions } from "../src/content/contact-fields.ts";
import type { ContactSubmission } from "../src/lib/contact-validation.ts";
import { autoReplyFirstName } from "../src/lib/first-name.ts";
import type { WorkerConfig } from "./config.ts";
import type { Mode } from "./env.ts";

/** "A website", "Help with a workflow", ... or "Partner" for the partner variant (it has no need field). */
export function needLabel(submission: ContactSubmission): string {
  if (submission.topic === "partner") return "Partner";
  return needOptions.find((option) => option.value === submission.need)?.label ?? "";
}

function cap(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function previewPrefix(mode: Mode): string {
  return mode === "production" ? "" : "[Preview] ";
}

/** The internal email to the site owner: plain text, every field labelled, plus whether the Sheet row was saved. */
export function notificationEmail(config: WorkerConfig, s: ContactSubmission, mode: Mode, receivedAt: string, sheetSaved: boolean) {
  const subject = cap(`${previewPrefix(mode)}New note: ${needLabel(s)} from ${s.name}`, 120);
  const lines = [
    `Need: ${needLabel(s)}`,
    `Topic link: ${s.topic || "(none)"}`,
    `Name: ${s.name}`,
    `Email: ${s.email}`,
    `Business:${s.business || "(not given)"}`,
    `Uses today: ${s.tools || "(not given)"}`,
    `Current website: ${s.website || "(not given)"}`,
    `Heard about ${config.businessName}: ${s.source || "(not given)"}`,
    "",
    "What's going on:",
    s.message,
    "",
    `Received: ${receivedAt}`,
    sheetSaved ? "Sheet: saved" : "Sheet: NOT saved - add this one by hand",
  ];
  if (mode !== "production") lines.push(`Mode: ${mode}`);
  return { subject, text: lines.join("\n") };
}

/** The B7b automatic reply. In preview it goes to the site owner instead, and the subject says who it would have gone to. */
export function autoReplyEmail(config: WorkerConfig, s: ContactSubmission, mode: Mode, bookingUrl: string | null) {
  const { autoReply } = config;
  const name = autoReplyFirstName(s.name);
  const greeting = name ? autoReply.greeting.replace("{firstName}", name) : autoReply.greetingNoName;
  // With no booking link ("none" in site.config.ts) the reply has no booking paragraph and no signature line for it.
  const { booking } = autoReply;
  const url = booking ? bookingUrl : null;
  const text = [
    greeting,
    ...autoReply.paragraphs,
    ...(booking && url ? [`${booking.before}${booking.linkText}${booking.after}\n${url}`] : []),
    ...autoReply.paragraphsAfter,
    autoReply.talkSoon,
    autoReply.signatureText.join("\n").replace("{bookingUrl}", url ?? ""),
  ].join("\n\n");

  const { ink, link: linkColor } = autoReply.colors;
  const p = (inner: string) => `<p style="margin:0 0 16px;">${inner}</p>`;
  const bookingParagraph =
    booking && url
      ? [p(`${escapeHtml(booking.before)}<a href="${escapeHtml(url)}" style="color:${escapeHtml(linkColor)};">${escapeHtml(booking.linkText)}</a>${escapeHtml(booking.after)}`)]
      : [];
  const html = [
    `<div style="max-width:560px;margin:0;text-align:left;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:${escapeHtml(ink)};">`,
    p(escapeHtml(greeting)),
    ...autoReply.paragraphs.map((t) => p(escapeHtml(t))),
    ...bookingParagraph,
    ...autoReply.paragraphsAfter.map((t) => p(escapeHtml(t))),
    p(escapeHtml(autoReply.talkSoon)),
    autoReply.signatureHtml.replace("{bookingUrl}", escapeHtml(url ?? "")),
    "</div>",
  ].join("\n");

  const subject = mode === "production" ? autoReply.subject : `[Preview → would go to ${s.email}] ${autoReply.subject}`;
  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** The Sheet row, in the header order: Received, Need, Topic, Name, Email, Business, Message, Tools, Website, Source, Mode. */
export function sheetRow(s: ContactSubmission, mode: Mode, receivedAt: string): string[] {
  return [receivedAt, needLabel(s), s.topic, s.name, s.email, s.business, s.message, s.tools, s.website, s.source, mode];
}
