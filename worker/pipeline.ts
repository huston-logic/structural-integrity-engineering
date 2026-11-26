import { log, retryable, TIMEOUT_MS } from "./env.ts";
import { isHttpsOrigin } from "./pipeline-url.ts";

/**
 * Saves one lead in the client's Pipeline app copy (huston-logic/pipeline README, "Connect a website form"): a
 * server-to-server `POST <pipelineUrl>/intake` with the shared secret in the `X-Intake-Secret` header. The app answers
 * 201 for a new lead and 200 for a repeat; any 2xx means saved. The secret is a Worker secret (INTAKE_SECRET) and never
 * reaches browser code. Logs hold fixed event names and status codes only, never the URL, the secret or the lead.
 */

export interface PipelineLead {
  name: string;
  email: string;
  /** At most 5,000 characters (the app's limit). */
  message: string;
  /** Left out of the request when empty. */
  business?: string;
}

/** Same contract as the Sheet writers: true only when the app saved the lead. Retries once on a rate limit, server error or network failure. */
export async function sendToPipeline(baseUrl: string | null | undefined, secret: string | undefined, lead: PipelineLead): Promise<boolean> {
  if (!baseUrl || !secret || !isHttpsOrigin(baseUrl)) {
    log("pipeline_config_missing");
    return false;
  }
  const body = JSON.stringify({
    name: lead.name,
    email: lead.email,
    message: lead.message,
    ...(lead.business ? { business: lead.business } : {}),
  });
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(new URL("/intake", baseUrl), {
        method: "POST",
        headers: { "content-type": "application/json", "x-intake-secret": secret },
        body,
        // Never follow a redirect: it could carry the secret header to another host. "manual" hands back the 3xx answer,
        // which is not 2xx, so it counts as a failure and is not retried.
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status >= 200 && response.status < 300) return true;
      log("pipeline_failed", { status: response.status, attempt });
      if (!retryable(response.status)) return false;
    } catch {
      log("pipeline_unreachable", { attempt });
    }
  }
  return false;
}
