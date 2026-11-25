import { contactFields, fieldLabel } from "../src/content/contact-fields.ts";
import type { ContactSubmission } from "../src/lib/contact-validation.ts";
import type { WorkerConfig } from "./config.ts";
import type { Mode } from "./env.ts";

function cap(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function previewPrefix(mode: Mode): string {
  return mode === "production" ? "" : "[Preview] ";
}

/** The internal email to the site owner: plain text, every field labelled, plus whether the Sheet row was saved. */
export function notificationEmail(s: ContactSubmission, mode: Mode, receivedAt: string, sheetSaved: boolean) {
  const subject = cap(`${previewPrefix(mode)}New request from ${s.firstName} ${s.lastName}`, 120);
  const lines = [
    ...contactFields.filter((field) => field.kind !== "textarea").map((field) => `${field.label}: ${s[field.key]}`),
    "",
    `${fieldLabel("scope")}:`,
    s.scope,
    "",
    `Received: ${receivedAt}`,
    sheetSaved ? "Sheet: saved" : "Sheet: NOT saved - add this one by hand",
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

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** The Sheet row, in the header order of `sheetHeaders` (contact-fields.ts): Received, the six fields, Mode. */
export function sheetRow(s: ContactSubmission, mode: Mode, receivedAt: string): string[] {
  return [receivedAt, ...contactFields.map((field) => s[field.key]), mode];
}
