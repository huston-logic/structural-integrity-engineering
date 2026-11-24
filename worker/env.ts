/** Bindings the contact Worker uses (wrangler.jsonc). Secrets are optional here so a missing one fails cleanly at runtime. */
export interface ContactEnv {
  SITE_ENV?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  /** Sheet writer "service-account" only. */
  GOOGLE_SERVICE_ACCOUNT_KEY?: string;
  GOOGLE_SHEET_ID?: string;
  /** Sheet writer "apps-script" only (the default): the web-app URL and the shared secret it checks. */
  SHEET_WEBHOOK_URL?: string;
  SHEET_WEBHOOK_SECRET?: string;
  CONTACT_RATE_LIMIT?: RateLimit;
}

/**
 * - development: `wrangler dev` on localhost. No email, no Sheet: the Worker logs a summary instead.
 * - preview: branch previews. Mail goes only to the site's own address, rows go to the Preview tab.
 * - production: the live site.
 */
export type Mode = "development" | "preview" | "production";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Reads the mode from SITE_ENV, with two guards: development only counts on a local host (so a stray setting can never
 * turn the live form into one that sends nothing), and any workers.dev host other than the production one
 * (`<workerName>.<account>.workers.dev`) is treated as a preview. Returns null for anything unexpected.
 * `workerName` is `domain.workerName` and `previewHostSuffix` is `domain.previewHostSuffix` in site.config.ts. A
 * placeholder worker name matches no host, so every workers.dev host counts as a preview (fails safe).
 */
export function resolveMode(siteEnv: string | undefined, hostname: string, workerName: string, previewHostSuffix: string): Mode | null {
  if (siteEnv === "development") return LOCAL_HOSTS.has(hostname) ? "development" : null;
  if (siteEnv === "preview") return "preview";
  if (siteEnv === "production") {
    if (hostname.endsWith(previewHostSuffix) && !hostname.startsWith(`${workerName}.`)) return "preview";
    return "production";
  }
  return null;
}

/** One structured log line. Only fixed event names and numbers: never names, emails, messages, IPs or secrets. */
export function log(event: string, detail: Record<string, string | number | boolean> = {}): void {
  console.log(JSON.stringify({ event, ...detail }));
}

/** Network calls give up after this long, so a slow provider can't hold the visitor's request open. */
export const TIMEOUT_MS = 8000;

/** True for responses worth one retry: rate limits and server errors. */
export function retryable(status: number): boolean {
  return status === 429 || status >= 500;
}
