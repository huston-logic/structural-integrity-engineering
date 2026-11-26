// Rules for site.config.ts that `npm run check:config` (scripts/sync-config.mjs) enforces, and the Worker secret names
// each form destination needs. Pure functions over a config object, so they have tests (config-rules.test.mjs).
// Names only, never values (docs/SECRETS.md).
import { isHttpsOrigin } from "../worker/pipeline-url.ts"; // the same rule the Worker applies before it sends the secret

const DESTINATIONS = ["sheet", "pipeline"];
const WRITERS = ["apps-script", "service-account"];

// The template's own rate-limit ids (docs/HOSTING.md). A site made from the template must pick its own pair.
const TEMPLATE_IDS = ["1001", "1002"];

const PLACEHOLDER = /\[\[[^\]]*\]\]/;

/**
 * Secret names for `secrets.required` in wrangler.jsonc. Always RESEND_API_KEY and TURNSTILE_SECRET_KEY; then
 * INTAKE_SECRET for the "pipeline" destination, or the Sheet writer's pair for "sheet" (a missing destination is "sheet").
 */
export function secretsFor(contact) {
  const destination = contact.destination ?? "sheet";
  if (!DESTINATIONS.includes(destination)) {
    throw new Error(`site.config.ts contact.destination must be "sheet" or "pipeline", not ${JSON.stringify(destination)}`);
  }
  const always = ["RESEND_API_KEY", "TURNSTILE_SECRET_KEY"];
  if (destination === "pipeline") return [...always, "INTAKE_SECRET"];
  if (contact.sheetWriter === "apps-script") return [...always, "SHEET_WEBHOOK_URL", "SHEET_WEBHOOK_SECRET"];
  if (contact.sheetWriter === "service-account") return [...always, "GOOGLE_SERVICE_ACCOUNT_KEY", "GOOGLE_SHEET_ID"];
  throw new Error(`site.config.ts contact.sheetWriter must be "apps-script" or "service-account", not ${JSON.stringify(contact.sheetWriter)}`);
}

// The template's own editor rate-limit id (docs/HOSTING.md).
const TEMPLATE_EDITOR_ID = "1003";

/** The paths the owner's editor adds to run_worker_first, only when editor.enabled is true. */
export const EDITOR_PATHS = [
  "/mcp",
  "/owner",
  "/owner/*",
  "/oauth/*",
  "/.well-known/oauth-authorization-server",
  "/.well-known/oauth-protected-resource",
  "/.well-known/oauth-protected-resource/*",
];

const blank = (value) => typeof value !== "string" || value.trim() === "" || PLACEHOLDER.test(value);

/** Problems with the `editor` block. Nothing is checked while it is missing or disabled. */
function editorProblems(c) {
  const e = c.editor;
  if (!e || e.enabled !== true) return [];
  const problems = [];
  const need = (path, message) => problems.push(`site.config.ts  editor.${path} ${message}`);

  const emails = Array.isArray(e.ownerEmails) ? e.ownerEmails : [];
  if (emails.length === 0) need("ownerEmails", "needs at least one owner email");
  for (const email of emails) {
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      need("ownerEmails", `has a value that is not an email address: ${JSON.stringify(email)}`);
    }
  }

  const team = e.access?.teamDomain;
  if (typeof team !== "string" || !/^[a-z0-9-]+$/.test(team)) {
    need("access.teamDomain", `must be the Cloudflare Access team name only (lowercase letters, digits and dashes), not ${JSON.stringify(team)}`);
  }
  if (blank(e.access?.aud)) need("access.aud", "must be set to the Access application's AUD tag");

  for (const key of ["owner", "repo", "botLogin"]) {
    if (blank(e.github?.[key])) need(`github.${key}`, "must be set");
  }
  for (const key of ["appId", "installationId"]) {
    const value = e.github?.[key];
    if (typeof value !== "string" || !/^[0-9]+$/.test(value)) {
      need(`github.${key}`, `must be a whole number written as a string, not ${JSON.stringify(value)}`);
    }
  }
  if (blank(e.workersSubdomain)) need("workersSubdomain", "must be set to the account's workers.dev subdomain");

  for (const key of ["oauth", "editor"]) {
    const id = e.kv?.[key];
    if (typeof id !== "string" || !/^[0-9a-f]{32}$/.test(id)) {
      need(`kv.${key}`, `must be a KV namespace id (32 lowercase hex characters), not ${JSON.stringify(id)}`);
    }
  }
  if (!Number.isInteger(e.dailyChangeLimit) || e.dailyChangeLimit < 1) {
    need("dailyChangeLimit", `must be a whole number of at least 1, not ${JSON.stringify(e.dailyChangeLimit)}`);
  }

  const id = e.rateLimitId;
  if (typeof id !== "string" || !/^[0-9]+$/.test(id)) {
    need("rateLimitId", `must be a whole number written as a string, like "2003", not ${JSON.stringify(id)}`);
  } else {
    const contactIds = [c.contact?.rateLimitIds?.production, c.contact?.rateLimitIds?.preview];
    if (contactIds.includes(id)) {
      need("rateLimitId", `is ${id}, the same as a contact form id. Bindings with the same id share counters, so pick another`);
    }
    const configured = typeof c.domain?.workerName === "string" && !PLACEHOLDER.test(c.domain.workerName);
    if (configured && id === TEMPLATE_EDITOR_ID) {
      need("rateLimitId", `is ${id}, the template's own id. Take a free number from docs/HOSTING.md and add the row there`);
    }
  }
  return problems;
}

const UPLOAD_TYPES = ["jpeg", "png", "webp", "heic", "pdf"];
const MAX_PHOTO_BYTES = 20_000_000; // the Images binding's input limit
const MAX_PDF_BYTES = 10_000_000; // the scope check's PDF cap (scripts/change-scope-rules.mjs)
const BUCKET_NAME = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

/**
 * Problems with `editor.uploads` (the owner's photo and PDF inbox). Nothing is checked while the block is missing. The
 * numbers are checked whether or not uploads are on; the bucket and the editor only matter once they are.
 */
function uploadsProblems(c) {
  const u = c.editor?.uploads;
  if (u === undefined || u === null) return [];
  const problems = [];
  const need = (path, message) => problems.push(`site.config.ts  editor.uploads.${path} ${message}`);
  const whole = (value) => Number.isInteger(value) && value >= 1;
  const names = UPLOAD_TYPES.map((t) => `"${t}"`).join(", ");

  for (const [key, cap] of [["maxPhotoBytes", MAX_PHOTO_BYTES], ["maxPdfBytes", MAX_PDF_BYTES], ["maxTotalBytes", null], ["maxPerDay", null]]) {
    if (!whole(u[key])) need(key, `must be a whole number of at least 1, not ${JSON.stringify(u[key])}`);
    else if (cap !== null && u[key] > cap) need(key, `is over the ${cap}-byte limit (${JSON.stringify(u[key])})`);
  }
  if (!whole(u.expireDays) || u.expireDays > 90) need("expireDays", `must be a whole number from 1 to 90, not ${JSON.stringify(u.expireDays)}`);

  if (!Array.isArray(u.types) || u.types.length === 0) {
    need("types", `needs at least one of ${names}`);
  } else {
    const seen = new Set();
    for (const type of u.types) {
      if (!UPLOAD_TYPES.includes(type)) need("types", `has ${JSON.stringify(type)}, which is not one of ${names}`);
      else if (seen.has(type)) need("types", `lists ${JSON.stringify(type)} more than once`);
      seen.add(type);
    }
  }

  if (u.enabled === true) {
    if (c.editor?.enabled !== true) need("enabled", "is true, but editor.enabled is not. Uploads exist only for the owner's editor, so turn the editor on first");
    if (typeof u.bucket !== "string" || !BUCKET_NAME.test(u.bucket)) {
      need("bucket", `must be an R2 bucket name (3 to 63 lowercase letters, digits and dashes, starting and ending with a letter or digit), not ${JSON.stringify(u.bucket)}`);
    }
  }
  return problems;
}

/** The text of wrangler.jsonc, generated from site.config.ts. Editor bindings appear only when editor.enabled is true. */
export function wranglerText(c) {
  const { limit, periodSeconds } = c.contact.rateLimit;
  const ids = c.contact.rateLimitIds;
  const editor = c.editor?.enabled === true ? c.editor : null;
  const uploads = editor && editor.uploads?.enabled === true ? editor.uploads : null;
  const secrets = [...secretsFor(c.contact), ...(editor ? ["GITHUB_APP_PRIVATE_KEY"] : [])];
  const rate = (name, id, lim, period) => `{ "name": "${name}", "namespace_id": "${id}", "simple": { "limit": ${lim}, "period": ${period} } }`;
  const contactRate = (id) => rate("CONTACT_RATE_LIMIT", id, limit, periodSeconds);
  const paths = ["/api/*", ...(editor ? EDITOR_PATHS : [])].map((p) => `"${p}"`).join(", ");
  const kv = editor
    ? `  // The owner's chat tools: OAuth tokens, and drafts with change times (docs/SECRETS.md).
  "kv_namespaces": [
    { "binding": "OAUTH_KV", "id": "${editor.kv.oauth}" },
    { "binding": "EDITOR_KV", "id": "${editor.kv.editor}" }
  ],
`
    : "";
  const uploadBindings = uploads
    ? `  // The owner's photo and PDF inbox: a private R2 bucket (docs/EDITING.md).
  "r2_buckets": [{ "binding": "UPLOADS", "bucket_name": "${uploads.bucket}" }],
  // Resizes and converts uploaded photos to WebP.
  "images": { "binding": "IMAGES" },
`
    : "";
  const ratelimits = editor
    ? `[
    ${contactRate(ids.production)},
    ${rate("EDITOR_RATE_LIMIT", editor.rateLimitId, 30, 60)}
  ]`
    : `[${contactRate(ids.production)}]`;
  return `{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "${c.domain.workerName}",
  // The Worker entry: the contact form on /api/*${editor ? " and the owner's chat tools" : ""}. Every page and file is served from ./out.
  "main": "./worker/index.ts",
  "compatibility_date": "2026-11-11",
  "assets": {
    "directory": "./out",
    "binding": "ASSETS",
    "not_found_handling": "404-page",
    "run_worker_first": [${paths}]
  },
  "vars": { "SITE_ENV": "production" },
  // Names only. Values are set with \`wrangler secret put\` (README, "Contact form").
  "secrets": {
    "required": [${secrets.map((name) => `"${name}"`).join(", ")}]
  },
${kv}${uploadBindings}  "ratelimits": ${ratelimits},
  // Invocation logs would store request metadata; the Worker's own log lines hold no personal data.
  "observability": { "enabled": true, "logs": { "invocation_logs": false } },
  // Worker Previews (branch previews) do not inherit the settings above, so they are repeated here.
  // Preview secrets are separate: \`wrangler preview base-config secret put\`. The editor never runs on a preview.
  "previews": {
    "vars": { "SITE_ENV": "preview" },
    "ratelimits": [${contactRate(ids.preview)}]
  }
}
`;
}

/** One plain line per problem; an empty array means the config passes. */
export function configProblems(c) {
  const problems = [];
  const { contact, domain } = c;

  const destination = contact.destination ?? "sheet";
  if (!DESTINATIONS.includes(destination)) {
    problems.push(`site.config.ts  contact.destination must be "sheet" or "pipeline", not ${JSON.stringify(contact.destination)}`);
  }
  if (!WRITERS.includes(contact.sheetWriter)) {
    problems.push(`site.config.ts  contact.sheetWriter must be "apps-script" or "service-account", not ${JSON.stringify(contact.sheetWriter)}`);
  }
  if (destination === "pipeline" && !isHttpsOrigin(contact.pipelineUrl)) {
    problems.push(
      `site.config.ts  contact.pipelineUrl must be the Pipeline app copy's https origin, like "https://pipeline.example.com" (lowercase, no path, no trailing slash, no ":443"), not ${JSON.stringify(contact.pipelineUrl)}`,
    );
  }

  const ids = contact.rateLimitIds;
  if (!ids || typeof ids !== "object") {
    problems.push("site.config.ts  contact.rateLimitIds is missing. Set { production, preview } to two whole numbers from docs/HOSTING.md");
    return [...problems, ...editorProblems(c), ...uploadsProblems(c)];
  }
  let numeric = true;
  for (const key of ["production", "preview"]) {
    if (typeof ids[key] !== "string" || !/^[0-9]+$/.test(ids[key])) {
      numeric = false;
      problems.push(`site.config.ts  contact.rateLimitIds.${key} must be a whole number written as a string, like "2001", not ${JSON.stringify(ids[key])}`);
    }
  }
  if (numeric) {
    if (ids.production === ids.preview) {
      problems.push("site.config.ts  contact.rateLimitIds.production and .preview must be different numbers");
    }
    // The template keeps 1001 and 1002; a site is "configured" once its Worker name is no longer a placeholder.
    const configured = typeof domain?.workerName === "string" && !PLACEHOLDER.test(domain.workerName);
    if (configured) {
      for (const key of ["production", "preview"]) {
        if (TEMPLATE_IDS.includes(ids[key])) {
          problems.push(
            `site.config.ts  contact.rateLimitIds.${key} is ${ids[key]}, the template's own id. Take a free pair from docs/HOSTING.md (new sites start at 2001) and add the row there`,
          );
        }
      }
    }
  }
  return [...problems, ...editorProblems(c), ...uploadsProblems(c)];
}
