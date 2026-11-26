import { honeypot } from "../src/content/contact-fields.ts";
import { CONTACT_BODY_BYTES } from "../src/forms/contact.ts";
import { contactKeys, validateContact, type ContactInput, type ContactSubmission } from "../src/lib/contact-validation.ts";
import { appendRowViaAppsScript } from "./apps-script.ts";
import { workerConfig, type WorkerConfig } from "./config.ts";
import { sendEmail } from "./email.ts";
import { log, resolveMode, type ContactEnv, type Mode, type SaveStatus } from "./env.ts";
import { findForm, formFiles, formSpec, TOKEN_KEY, type Delivery, type FormSource, type SubmissionSpec } from "./forms.ts";
import { jsonResponse } from "./http.ts";
import { autoReplyEmail, notificationEmail, pipelineMessage, sheetRow } from "./messages.ts";
import { sendToPipeline } from "./pipeline.ts";
import { readBody } from "./read-body.ts";
import { appendRow } from "./sheets.ts";
import { verifyTurnstile } from "./turnstile.ts";

/**
 * The form Worker (docs/website-plan.md E6, and the forms design for the other forms). wrangler.jsonc runs it only for
 * /api/*; everything else is the static export in ./out. POST /api/contact (the contact form) and POST /api/forms/<id>
 * (every other form) run one handler with a per-form spec: same-origin JSON, body limit, rate limit, honeypot, the same
 * validation as the form, Turnstile, then the save (a Sheet row, or a lead in the client's Pipeline app copy:
 * `contact.destination`), the email to the site owner and, for the contact form, the automatic reply (for a download
 * form, the download email). It never reports success unless the note reached the owner (the Sheet, the app or the
 * email) and never sends HTML except the fixed automatic-reply template.
 * Every client-specific value (names, email, booking link, Worker name, Sheet tabs, Sheet writer) comes from
 * site.config.ts through worker/config.ts; `createWorker` takes that config so the tests can pass a fixture.
 */

const MAX_TOKEN_LENGTH = 2048;
const FORMS_PREFIX = "/api/forms/";
const CONTACT_KEYS = new Set<string>([...contactKeys, honeypot.name, TOKEN_KEY]);
const REPLY_HEADERS = { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" };

/** What the form reads. `error` picks the message; `fields` lists the Rev 7.1 field errors. */
type ApiBody = { ok: true; autoReply?: boolean; delivered?: boolean } | { ok: false; error: "invalid" | "rejected" | "rate_limited" | "failed"; fields?: string[] };

const CSP = { "content-security-policy": "default-src 'none'; frame-ancestors 'none'" };

function json(status: number, body: ApiBody | { error: string }, extra: Record<string, string> = {}): Response {
  return jsonResponse(status, body, { ...CSP, ...extra });
}

/** The Sheet writer is chosen here (`contact.sheetWriter` in site.config.ts). Both return true only when the row was saved. */
function saveRow(config: WorkerConfig, env: ContactEnv, tab: string, row: string[]): Promise<boolean> {
  return config.sheetWriter === "apps-script"
    ? appendRowViaAppsScript(env.SHEET_WEBHOOK_URL, env.SHEET_WEBHOOK_SECRET, tab, row)
    : appendRow(env.GOOGLE_SERVICE_ACCOUNT_KEY, env.GOOGLE_SHEET_ID, tab, row);
}

/**
 * THE one place a submission is saved, chosen by `contact.destination` in site.config.ts. Every form builds its own
 * `Delivery` (Sheet tabs and row, Pipeline lead); this function only decides where it goes. Returns "saved" only when
 * the contact is really in the destination; "skipped" when it was deliberately not sent (a preview never posts to the
 * client's real app). The notification email follows this result and always goes out (see handleSubmission).
 *
 * THIRD DESTINATION GOES HERE. "Another tool the client names" is not built (docs/PROCESS.md rule 15). To add one:
 * add its name to `Destination` in worker/config.ts and to `DESTINATIONS` and `secretsFor` in scripts/config-rules.mjs,
 * add its label to `saveLine` in worker/messages.ts, write its sender next to worker/pipeline.ts (true only when saved,
 * fixed log names), add a branch below, and add tests beside "the Pipeline app destination" in worker/contact.test.ts.
 */
async function saveSubmission(config: WorkerConfig, env: ContactEnv, mode: Mode, delivery: Delivery): Promise<SaveStatus> {
  if (config.destination === "pipeline") {
    if (mode !== "production") return "skipped";
    return (await sendToPipeline(config.pipelineUrl, env.INTAKE_SECRET, delivery.lead)) ? "saved" : "failed";
  }
  const tab = mode === "preview" ? delivery.tabs.preview : delivery.tabs.production;
  return (await saveRow(config, env, tab, delivery.row)) ? "saved" : "failed";
}

/** The contact form's spec: its flat body, 16 KB limit, rate key, Turnstile action, Sheet row, Pipeline message, notification and automatic reply. */
function contactSpec(config: WorkerConfig): SubmissionSpec<ContactSubmission> {
  return {
    maxBytes: CONTACT_BODY_BYTES,
    keys: CONTACT_KEYS,
    action: "contact",
    rateKey: (ip) => ip,
    validate: (fields) => validateContact(fields as ContactInput),
    dryRun(value) {
      log("dry_run", { scopeLength: value.scope.length });
      return { ok: true, autoReply: true };
    },
    delivery: (value, mode, receivedAt) => ({
      tabs: { production: config.sheetTabs.production, preview: config.sheetTabs.preview },
      row: sheetRow(value, mode, receivedAt),
      lead: { name: `${value.firstName} ${value.lastName}`, email: value.email, message: pipelineMessage(value) },
    }),
    notification: (value, mode, receivedAt, status) => ({ ...notificationEmail(config, value, mode, receivedAt, status), replyTo: value.email }),
    async finish({ env, siteEmail }, value, mode, id) {
      const reply = autoReplyEmail(config, value, mode);
      const recipient = mode === "production" ? value.email : siteEmail;
      const replyFrom = `${config.replyFromName} <${siteEmail}>`;
      const autoReplied = await sendEmail(env.RESEND_API_KEY, { from: replyFrom, to: recipient, replyTo: siteEmail, headers: REPLY_HEADERS, ...reply }, `${id}-reply`, "auto_reply");
      if (!autoReplied) log("auto_reply_failed");
      return { ok: true, autoReply: autoReplied };
    },
  };
}

async function handleSubmission<T>(config: WorkerConfig, spec: SubmissionSpec<T>, request: Request, env: ContactEnv, url: URL): Promise<Response> {
  const mode = resolveMode(env.SITE_ENV, url.hostname, config.workerName, config.previewHostSuffix);
  if (!mode) {
    log("config_invalid_mode");
    return json(500, { ok: false, error: "failed" });
  }

  // Only the site's own pages may post here. A JSON content type also forces a CORS preflight from anywhere else,
  // and the Worker never answers one.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (request.headers.get("origin") !== url.origin || (fetchSite !== null && fetchSite !== "same-origin")) {
    log("rejected_origin");
    return json(403, { ok: false, error: "rejected" });
  }
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return json(415, { ok: false, error: "rejected" });
  }
  if (Number(request.headers.get("content-length") ?? "0") > spec.maxBytes) return json(413, { ok: false, error: "rejected" });
  const text = await readBody(request, spec.maxBytes);
  if (text === null) return json(413, { ok: false, error: "rejected" });

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return json(400, { ok: false, error: "rejected" });
  }
  if (typeof data !== "object" || data === null || Array.isArray(data) || Object.keys(data).some((key) => !spec.keys.has(key))) {
    return json(400, { ok: false, error: "rejected" });
  }
  const fields = data as Record<string, unknown>;

  const ip = request.headers.get("cf-connecting-ip");
  if (env.CONTACT_RATE_LIMIT) {
    const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: spec.rateKey(ip ?? "unknown") });
    if (!success) {
      log("rate_limited");
      return json(429, { ok: false, error: "rate_limited" });
    }
  } else {
    log("rate_limit_binding_missing");
  }

  // The spam trap gets an honest error, never a pretend success.
  const trap = fields[honeypot.name];
  if (trap !== undefined && trap !== "") {
    log("honeypot_filled");
    return json(400, { ok: false, error: "rejected" });
  }

  const result = spec.validate(fields);
  if (!result.ok) {
    if (result.malformed || result.fields.length === 0) return json(400, { ok: false, error: "rejected" });
    return json(400, { ok: false, error: "invalid", fields: result.fields });
  }
  const submission = result.value;

  // A missing or refused secret is our fault, not the visitor's: answer "failed" (502), never "couldn't verify".
  if (!env.TURNSTILE_SECRET_KEY) {
    log("turnstile_config_missing");
    return json(502, { ok: false, error: "failed" });
  }
  const token = fields[TOKEN_KEY];
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    log("turnstile_token_missing");
    return json(403, { ok: false, error: "rejected" });
  }
  const check = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip);
  if (check.unavailable) {
    log("turnstile_unavailable", { codes: check.errorCodes.join(",") });
    return json(502, { ok: false, error: "failed" });
  }
  // Cloudflare's test keys (local development only) return no action and hostname "example.com".
  const strict = mode !== "development";
  const reason = !check.success
    ? "not_success"
    : strict && check.hostname !== url.hostname
      ? "hostname_mismatch"
      : strict && check.action !== spec.action
        ? "action_mismatch"
        : null;
  if (reason) {
    log("turnstile_failed", { reason, codes: check.errorCodes.join(",") });
    return json(403, { ok: false, error: "rejected" });
  }

  const receivedAt = new Date().toISOString();
  if (mode === "development") return json(200, spec.dryRun(submission));

  // Fail closed while the site email is still unset (the starter template): no Sheet row, no mail.
  const { siteEmail } = config;
  if (!siteEmail) {
    log("config_incomplete");
    return json(502, { ok: false, error: "failed" });
  }
  const from = `${config.fromName} <${siteEmail}>`;

  // The destination goes first so the email to the owner can say whether the contact was saved. The email always sends.
  // The visitor sees success only if the contact reached the client somewhere: the destination or the email.
  const id = crypto.randomUUID();
  const status = await saveSubmission(config, env, mode, spec.delivery(submission, mode, receivedAt));
  const notification = spec.notification(submission, mode, receivedAt, status);
  const notified = await sendEmail(env.RESEND_API_KEY, { from, to: siteEmail, ...notification }, `${id}-notify`, "notify");

  if (status !== "saved" && !notified) {
    log("capture_failed");
    return json(502, { ok: false, error: "failed" });
  }
  if (!notified) log(config.destination === "pipeline" ? "notify_failed_pipeline_saved" : "notify_failed_sheet_saved");

  return json(200, await spec.finish({ config, env, siteEmail }, submission, mode, id));
}

/**
 * Builds the Worker from a config. The default export below uses the real site.config.ts and the generated form
 * registry; the tests pass a fixture config and, for the forms, their own definitions.
 */
export function createWorker(config: WorkerConfig, forms: FormSource = formFiles) {
  return {
    async fetch(request: Request, env: ContactEnv): Promise<Response> {
      const url = new URL(request.url);
      const isContact = url.pathname === "/api/contact";
      const formId = url.pathname.startsWith(FORMS_PREFIX) ? url.pathname.slice(FORMS_PREFIX.length) : null;
      if (!isContact && formId === null) return json(404, { error: "not_found" });

      // An unknown or archived form is a 404 before anything is read, limited or sent.
      let formResponse: ((request: Request) => Promise<Response>) | null = null;
      if (formId !== null) {
        const found = findForm(config, forms, formId);
        if (found.kind === "missing") return json(404, { error: "not_found" });
        if (found.kind === "invalid") {
          log("form_definition_invalid");
          return json(500, { ok: false, error: "failed" });
        }
        const spec = formSpec(config, found.def, formId);
        formResponse = (req) => handleSubmission(config, spec, req, env, url);
      }
      if (request.method !== "POST") return json(405, { error: "method_not_allowed" }, { allow: "POST" });
      return formResponse ? formResponse(request) : handleSubmission(config, contactSpec(config), request, env, url);
    },
  } satisfies ExportedHandler<ContactEnv>;
}

export default createWorker(workerConfig);
