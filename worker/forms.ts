import { honeypot } from "../src/content/contact-fields.ts";
import { formFiles } from "../src/forms/registry.generated.ts";
import { FORM_ID_RE, CONTACT_FORM_ID, type FormDefinition } from "../src/forms/schema.ts";
import { validateSubmission, parseForm, type SubmissionValue } from "../src/forms/validate.ts";
import type { PipelineLead } from "./pipeline.ts";
import type { WorkerConfig } from "./config.ts";
import { sendEmail } from "./email.ts";
import { log, type ContactEnv, type Mode, type SaveStatus } from "./env.ts";
import { downloadEmail, formNotificationEmail, formPipelineLead, formSheetRow } from "./messages.ts";

/**
 * The other forms (docs/superpowers/specs/2026-11-25-forms-and-downloads-design.md, "The Worker"). `POST /api/forms/<id>`
 * runs the same handler as the contact form (worker/contact.ts) with the spec built here. Definitions come only from the
 * generated registry (or the list a test passes), always through `parseForm`, so a bundled file that fails the shared
 * check is refused (fail closed).
 */

export const TOKEN_KEY = "turnstileToken";

export type Validation<T> = { ok: true; value: T } | { ok: false; malformed: boolean; fields: string[] };

/** Where one submission goes: the Sheet tabs and row, and the Pipeline lead. `saveSubmission` is the only reader. */
export interface Delivery {
  tabs: { production: string; preview: string };
  row: string[];
  lead: PipelineLead;
}

export interface FinishContext {
  config: WorkerConfig;
  env: ContactEnv;
  siteEmail: string;
}

export type SubmissionOk = { ok: true; autoReply?: boolean; delivered?: boolean };

/** Everything that differs between the contact form and another form. */
export interface SubmissionSpec<T> {
  maxBytes: number;
  keys: ReadonlySet<string>;
  /** The Turnstile action the widget was rendered with. */
  action: "contact" | "form";
  rateKey(ip: string): string;
  validate(fields: Record<string, unknown>): Validation<T>;
  /** Development mode only: logs and answers without saving or sending. */
  dryRun(value: T): SubmissionOk;
  delivery(value: T, mode: Mode, receivedAt: string): Delivery;
  notification(value: T, mode: Mode, receivedAt: string, status: SaveStatus): { subject: string; text: string; replyTo: string };
  /** After the owner has the answers: the visitor email, if the form sends one. */
  finish(ctx: FinishContext, value: T, mode: Mode, id: string): Promise<SubmissionOk>;
}

export type FormSource = readonly { id: string; data: unknown }[];

export type FormLookup = { kind: "found"; def: FormDefinition } | { kind: "missing" } | { kind: "invalid" };

/** The live definition for an id. Unknown, archived and the contact id are "missing" (404); a file that fails the shared check is "invalid". */
export function findForm(config: WorkerConfig, source: FormSource, id: string): FormLookup {
  if (!FORM_ID_RE.test(id) || id === CONTACT_FORM_ID) return { kind: "missing" };
  const file = source.find((entry) => entry.id === id);
  if (!file) return { kind: "missing" };
  const raw = file.data as { status?: unknown } | null;
  if (raw !== null && typeof raw === "object" && raw.status === "archived") return { kind: "missing" };
  const def = parseForm(file.data, config.forms, id);
  if (!def) return { kind: "invalid" };
  return def.status === "live" ? { kind: "found", def } : { kind: "missing" };
}

export function formSpec(config: WorkerConfig, def: FormDefinition, id: string): SubmissionSpec<SubmissionValue> {
  return {
    maxBytes: config.forms.maxBodyBytes,
    keys: new Set<string>([...def.fields.map((field) => field.id), honeypot.name, TOKEN_KEY]),
    action: "form",
    rateKey: (ip) => `${id}:${ip}`,
    validate(fields) {
      const { [honeypot.name]: _trap, [TOKEN_KEY]: _token, ...answers } = fields;
      void _trap;
      void _token;
      return validateSubmission(def, answers);
    },
    dryRun() {
      log("dry_run", { form: true });
      return { ok: true, ...(def.download ? { delivered: true } : {}) };
    },
    delivery: (value, mode, receivedAt) => ({
      tabs: { production: config.sheetTabs.forms, preview: config.sheetTabs.formsPreview },
      row: formSheetRow(def, value, mode, receivedAt),
      lead: formPipelineLead(def, value),
    }),
    notification: (value, mode, receivedAt, status) => ({
      ...formNotificationEmail(config, def, value, mode, receivedAt, status),
      replyTo: formPipelineLead(def, value).email,
    }),
    async finish({ env, siteEmail }, value, mode, submissionId) {
      const { download } = def;
      if (!download) return { ok: true };
      // The link comes from the site's own address in config, never from the request.
      if (!download.href.startsWith("/files/")) {
        log("download_link_invalid");
        return { ok: true, delivered: false };
      }
      const visitor = formPipelineLead(def, value).email;
      const email = downloadEmail(config, download, mode, visitor);
      const to = mode === "production" ? visitor : siteEmail;
      const sent = await sendEmail(
        env.RESEND_API_KEY,
        { from: `${config.replyFromName} <${siteEmail}>`, to, replyTo: siteEmail, headers: { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" }, ...email },
        `${submissionId}-download`,
        "download",
      );
      if (!sent) log("download_email_failed");
      return { ok: true, delivered: sent };
    },
  };
}

export { formFiles };
