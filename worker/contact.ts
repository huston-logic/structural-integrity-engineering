import { honeypot } from "../src/content/contact-fields.ts";
import { contactKeys, validateContact, type ContactInput, type ContactSubmission } from "../src/lib/contact-validation.ts";
import { appendRowViaAppsScript } from "./apps-script.ts";
import { workerConfig, type WorkerConfig } from "./config.ts";
import { sendEmail } from "./email.ts";
import { log, resolveMode, type ContactEnv, type Mode, type SaveStatus } from "./env.ts";
import { autoReplyEmail, notificationEmail, pipelineMessage, sheetRow } from "./messages.ts";
import { sendToPipeline } from "./pipeline.ts";
import { appendRow } from "./sheets.ts";
import { verifyTurnstile } from "./turnstile.ts";

/**
 * The contact form Worker (docs/website-plan.md E6). wrangler.jsonc runs it only for /api/*; everything else is the
 * static export in ./out. POST /api/contact: same-origin JSON, rate limit, honeypot, the same validation as the form,
 * Turnstile, then the save (a Sheet row, or a lead in the client's Pipeline app copy: `contact.destination`), the email
 * to the site owner and the automatic reply. It never reports success unless the note reached the owner (the Sheet, the
 * app or the email) and never sends HTML except the fixed automatic-reply template.
 * Every client-specific value (names, email, booking link, Worker name, Sheet tabs, Sheet writer) comes from
 * site.config.ts through worker/config.ts; `createWorker` takes that config so the tests can pass a fixture.
 */

const MAX_BODY_BYTES = 16 * 1024;
const MAX_TOKEN_LENGTH = 2048;
const TOKEN_KEY = "turnstileToken";
const ALLOWED_KEYS = new Set<string>([...contactKeys, honeypot.name, TOKEN_KEY]);
const REPLY_HEADERS = { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" };

/** What the form reads. `error` picks the message; `fields` lists the Rev 7.1 field errors. */
type ApiBody = { ok: true; autoReply: boolean } | { ok: false; error: "invalid" | "rejected" | "rate_limited" | "failed"; fields?: string[] };

const SECURITY_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "cross-origin-resource-policy": "same-origin",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
};

function json(status: number, body: ApiBody | { error: string }, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...SECURITY_HEADERS, ...extra } });
}

/** Reads the body as text, stopping as soon as it passes the limit. Returns null when it is too large. */
async function readBody(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/** The Sheet writer is chosen here (`contact.sheetWriter` in site.config.ts). Both return true only when the row was saved. */
function saveRow(config: WorkerConfig, env: ContactEnv, tab: string, row: string[]): Promise<boolean> {
  return config.sheetWriter === "apps-script"
    ? appendRowViaAppsScript(env.SHEET_WEBHOOK_URL, env.SHEET_WEBHOOK_SECRET, tab, row)
    : appendRow(env.GOOGLE_SERVICE_ACCOUNT_KEY, env.GOOGLE_SHEET_ID, tab, row);
}

/**
 * THE one place a submission is saved, chosen by `contact.destination` in site.config.ts. Returns "saved" only when the
 * contact is really in the destination; "skipped" when it was deliberately not sent (a preview never posts to the
 * client's real app). The notification email follows this result and always goes out (see handleContact).
 *
 * THIRD DESTINATION GOES HERE. "Another tool the client names" is not built (docs/PROCESS.md rule 15). To add one:
 * add its name to `Destination` in worker/config.ts and to `DESTINATIONS` and `secretsFor` in scripts/config-rules.mjs,
 * add its label to `saveLine` in worker/messages.ts, write its sender next to worker/pipeline.ts (true only when saved,
 * fixed log names), add a branch below, and add tests beside "the Pipeline app destination" in worker/contact.test.ts.
 */
async function saveSubmission(config: WorkerConfig, env: ContactEnv, mode: Mode, submission: ContactSubmission, receivedAt: string): Promise<SaveStatus> {
  if (config.destination === "pipeline") {
    if (mode !== "production") return "skipped";
    const lead = { name: `${submission.firstName} ${submission.lastName}`, email: submission.email, message: pipelineMessage(submission) };
    return (await sendToPipeline(config.pipelineUrl, env.INTAKE_SECRET, lead)) ? "saved" : "failed";
  }
  const tab = mode === "preview" ? config.sheetTabs.preview : config.sheetTabs.production;
  return (await saveRow(config, env, tab, sheetRow(submission, mode, receivedAt))) ? "saved" : "failed";
}

async function handleContact(config: WorkerConfig, request: Request, env: ContactEnv, url: URL): Promise<Response> {
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
  if (Number(request.headers.get("content-length") ?? "0") > MAX_BODY_BYTES) return json(413, { ok: false, error: "rejected" });
  const text = await readBody(request, MAX_BODY_BYTES);
  if (text === null) return json(413, { ok: false, error: "rejected" });

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return json(400, { ok: false, error: "rejected" });
  }
  if (typeof data !== "object" || data === null || Array.isArray(data) || Object.keys(data).some((key) => !ALLOWED_KEYS.has(key))) {
    return json(400, { ok: false, error: "rejected" });
  }
  const fields = data as Record<string, unknown>;

  const ip = request.headers.get("cf-connecting-ip");
  if (env.CONTACT_RATE_LIMIT) {
    const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: ip ?? "unknown" });
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

  const result = validateContact(fields as ContactInput);
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
      : strict && check.action !== "contact"
        ? "action_mismatch"
        : null;
  if (reason) {
    log("turnstile_failed", { reason, codes: check.errorCodes.join(",") });
    return json(403, { ok: false, error: "rejected" });
  }

  const receivedAt = new Date().toISOString();
  if (mode === "development") {
    log("dry_run", { scopeLength: submission.scope.length });
    return json(200, { ok: true, autoReply: true });
  }

  // Fail closed while the site email is still unset (the starter template): no Sheet row, no mail.
  const { siteEmail } = config;
  if (!siteEmail) {
    log("config_incomplete");
    return json(502, { ok: false, error: "failed" });
  }
  const from = `${config.fromName} <${siteEmail}>`;
  const replyFrom = `${config.replyFromName} <${siteEmail}>`;

  // The destination goes first so the email to the owner can say whether the contact was saved. The email always sends.
  // The visitor sees success only if the contact reached the client somewhere: the destination or the email.
  const id = crypto.randomUUID();
  const status = await saveSubmission(config, env, mode, submission, receivedAt);
  const notification = notificationEmail(config, submission, mode, receivedAt, status);
  const notified = await sendEmail(env.RESEND_API_KEY, { from, to: siteEmail, replyTo: submission.email, ...notification }, `${id}-notify`, "notify");

  if (status !== "saved" && !notified) {
    log("capture_failed");
    return json(502, { ok: false, error: "failed" });
  }
  if (!notified) log(config.destination === "pipeline" ? "notify_failed_pipeline_saved" : "notify_failed_sheet_saved");

  const reply = autoReplyEmail(config, submission, mode);
  const recipient = mode === "production" ? submission.email : siteEmail;
  const autoReplied = await sendEmail(env.RESEND_API_KEY, { from: replyFrom, to: recipient, replyTo: siteEmail, headers: REPLY_HEADERS, ...reply }, `${id}-reply`, "auto_reply");
  if (!autoReplied) log("auto_reply_failed");

  return json(200, { ok: true, autoReply: autoReplied });
}

/** Builds the Worker from a config. The default export below uses the real site.config.ts; the tests pass a fixture. */
export function createWorker(config: WorkerConfig) {
  return {
    async fetch(request: Request, env: ContactEnv): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname !== "/api/contact") return json(404, { error: "not_found" });
      if (request.method !== "POST") return json(405, { error: "method_not_allowed" }, { allow: "POST" });
      return handleContact(config, request, env, url);
    },
  } satisfies ExportedHandler<ContactEnv>;
}

export default createWorker(workerConfig);
