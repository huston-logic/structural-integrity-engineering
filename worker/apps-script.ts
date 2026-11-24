import { log, retryable, TIMEOUT_MS } from "./env.ts";
import { safeCell } from "./sheets.ts";

/**
 * Appends one row to the Google Sheet through a Google Apps Script web app (docs/apps-script/contact-sheet.gs), the
 * default Sheet writer. The Worker POSTs JSON `{ secret, tab, row }` to the web-app URL; the script checks the shared
 * secret, accepts only its two configured tab names and writes the row as plain text. Apps Script answers a POST with a
 * redirect to the result, which `fetch` follows. Success is HTTP 200 and a JSON body of `{"ok":true}`.
 * The URL and the secret are Worker secrets (SHEET_WEBHOOK_URL, SHEET_WEBHOOK_SECRET). Logs hold fixed event names and
 * status codes only, never the URL, the secret or any row data.
 */

/** Apps Script web apps are always served from this host; anything else is a mistake and would receive the secret. */
const WEB_APP_HOST = "script.google.com";

function isWebAppUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === WEB_APP_HOST;
  } catch {
    return false;
  }
}

/** Same contract as `appendRow` in sheets.ts: true only when the row was saved. Retries once on a rate limit, server error or network failure. */
export async function appendRowViaAppsScript(webhookUrl: string | undefined, secret: string | undefined, tab: string, row: string[]): Promise<boolean> {
  if (!webhookUrl || !secret || !isWebAppUrl(webhookUrl)) {
    log("sheet_config_missing");
    return false;
  }
  const body = JSON.stringify({ secret, tab, row: row.map(safeCell) });
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status === 200) {
        const data = (await response.json().catch(() => null)) as { ok?: unknown } | null;
        if (data?.ok === true) return true;
        log("sheet_append_rejected", { attempt });
        return false;
      }
      log("sheet_append_failed", { status: response.status, attempt });
      if (!retryable(response.status)) return false;
    } catch {
      log("sheet_unreachable", { attempt });
    }
  }
  return false;
}
