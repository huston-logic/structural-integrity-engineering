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
    return problems;
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
  return problems;
}
