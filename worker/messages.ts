import { contactFields, fieldLabel } from "../src/content/contact-fields.ts";
import type { ContactSubmission } from "../src/lib/contact-validation.ts";
import type { Destination, WorkerConfig } from "./config.ts";
import type { Mode, SaveStatus } from "./env.ts";
import { escapeHtml } from "./html.ts";

/** The most characters the Pipeline app accepts in `message`. */
const PIPELINE_MESSAGE_MAX = 5000;

function cap(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function previewPrefix(mode: Mode): string {
  return mode === "production" ? "" : "[Preview] ";
}

/** The notification line that says whether the contact reached its destination, so the owner knows when to add it by hand. */
function saveLine(destination: Destination, status: SaveStatus): string {
  const where = destination === "pipeline" ? "Pipeline app" : "Sheet";
  if (status === "saved") return `${where}: saved`;
  if (status === "skipped") return `${where}: not sent (preview)`;
  return `${where}: NOT saved - add this one by hand`;
}

/** The internal email to the site owner: plain text, every field labelled, plus whether the Sheet row or the app lead was saved. */
export function notificationEmail(config: WorkerConfig, s: ContactSubmission, mode: Mode, receivedAt: string, status: SaveStatus) {
  const subject = cap(`${previewPrefix(mode)}New request from ${s.firstName} ${s.lastName}`, 120);
  const lines = [
    ...contactFields.filter((field) => field.kind !== "textarea").map((field) => `${field.label}: ${s[field.key]}`),
    "",
    `${fieldLabel("scope")}:`,
    s.scope,
    "",
    `Received: ${receivedAt}`,
    saveLine(config.destination, status),
  ];
  if (mode !== "production") lines.push(`Mode: ${mode}`);
  return { subject, text: lines.join("\n") };
}

/** The automatic reply. In preview it goes to the site owner instead, and the subject says who it would have gone to. */
export function autoReplyEmail(config: WorkerConfig, s: ContactSubmission, mode: Mode) {
  const { autoReply } = config;
  const text = [autoReply.greeting, ...autoReply.paragraphs, autoReply.signoff, autoReply.signatureText.join("\n")].join("\n\n");

  const p = (inner: string) => `<p style="margin:0 0 16px;">${inner}</p>`;
  const html = [
    `<div style="max-width:560px;margin:0;text-align:left;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:${escapeHtml(autoReply.colors.ink)};">`,
    p(escapeHtml(autoReply.greeting)),
    ...autoReply.paragraphs.map((t) => p(escapeHtml(t))),
    p(escapeHtml(autoReply.signoff)),
    autoReply.signatureHtml,
    "</div>",
  ].join("\n");

  const subject = mode === "production" ? autoReply.subject : `[Preview → would go to ${s.email}] ${autoReply.subject}`;
  return { subject, text, html };
}

/**
 * The Pipeline app has name, email, message, business and source only, so the other answers travel inside the message:
 * the visitor's own words (the project scope) first, then one labelled line per other answer. Capped at the app's 5,000
 * characters from the end, so the visitor's words always come first.
 */
export function pipelineMessage(s: ContactSubmission): string {
  const extras = [`${fieldLabel("phone")}: ${s.phone}`, `${fieldLabel("location")}: ${s.location}`];
  return cap(`${s.scope}\n\n${extras.join("\n")}`, PIPELINE_MESSAGE_MAX);
}

/** The Sheet row, in the header order of `sheetHeaders` (contact-fields.ts): Received, the six fields, Mode. */
export function sheetRow(s: ContactSubmission, mode: Mode, receivedAt: string): string[] {
  return [receivedAt, ...contactFields.map((field) => s[field.key]), mode];
}
