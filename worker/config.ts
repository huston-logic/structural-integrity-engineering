import { siteConfig } from "../site.config.ts";
import { buildAutoReply, type AutoReply, type AutoReplyConfig } from "../src/content/auto-reply.ts";

/** Which code appends the contact form's row to the Google Sheet. */
export type SheetWriter = "apps-script" | "service-account";

/** Where each submission is saved (`contact.destination` in site.config.ts). The default is the Sheet. */
export type Destination = "sheet" | "pipeline";

/**
 * The slice of site.config.ts the Worker reads. A structural type (not `typeof siteConfig`, whose values are literal
 * types), so the tests can build a Worker from a fixture instead of the real config.
 */
export interface WorkerSiteConfig extends AutoReplyConfig {
  domain: { url: string; workerName: string; previewHostSuffix: string };
  contact: {
    siteEmail: string | null;
    fromName: string;
    replyFromName: string;
    sheetWriter: SheetWriter;
    sheetTabs: { production: string; preview: string };
    /** Optional so a config without it means "sheet". */
    destination?: Destination;
    /** The Pipeline app copy's https origin. Only read when destination is "pipeline". */
    pipelineUrl?: string | null;
  };
}

/** Everything client-specific the Worker needs, resolved once. */
export interface WorkerConfig {
  businessName: string;
  /** From, notify To and Reply-To. null until the owner sets it: the Worker then refuses to send (worker/contact.ts). */
  siteEmail: string | null;
  fromName: string;
  replyFromName: string;
  workerName: string;
  previewHostSuffix: string;
  sheetWriter: SheetWriter;
  sheetTabs: { production: string; preview: string };
  destination: Destination;
  /** null when the destination is "sheet" or the owner has not set it. The Worker then saves nothing to the app. */
  pipelineUrl: string | null;
  autoReply: AutoReply;
}

export function buildWorkerConfig(config: WorkerSiteConfig): WorkerConfig {
  const { contact, domain } = config;
  return {
    businessName: config.business.name,
    siteEmail: contact.siteEmail,
    fromName: contact.fromName,
    replyFromName: contact.replyFromName,
    workerName: domain.workerName,
    previewHostSuffix: domain.previewHostSuffix,
    sheetWriter: contact.sheetWriter,
    sheetTabs: contact.sheetTabs,
    destination: contact.destination ?? "sheet",
    pipelineUrl: contact.pipelineUrl ?? null,
    autoReply: buildAutoReply(config),
  };
}

/** The Worker's settings, from the real site.config.ts. */
export const workerConfig: WorkerConfig = buildWorkerConfig(siteConfig);
