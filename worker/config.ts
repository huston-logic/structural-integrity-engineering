import { siteConfig } from "../site.config.ts";
import { buildAutoReply, type AutoReply, type AutoReplyConfig } from "../src/content/auto-reply.ts";

/** Which code appends the contact form's row to the Google Sheet. */
export type SheetWriter = "apps-script" | "service-account";

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
    schedulerUrl: string | null;
    sheetWriter: SheetWriter;
    sheetTabs: { production: string; preview: string };
  };
}

/** Everything client-specific the Worker needs, resolved once. */
export interface WorkerConfig {
  businessName: string;
  /** From, notify To and Reply-To. null until the owner sets it: the Worker then refuses to send (worker/contact.ts). */
  siteEmail: string | null;
  fromName: string;
  replyFromName: string;
  /** The booking link in the automatic reply. null until a scheduler is chosen: the Worker then refuses to send. */
  bookingUrl: string | null;
  workerName: string;
  previewHostSuffix: string;
  sheetWriter: SheetWriter;
  sheetTabs: { production: string; preview: string };
  autoReply: AutoReply;
}

export function buildWorkerConfig(config: WorkerSiteConfig): WorkerConfig {
  const { contact, domain } = config;
  return {
    businessName: config.business.name,
    siteEmail: contact.siteEmail,
    fromName: contact.fromName,
    replyFromName: contact.replyFromName,
    bookingUrl: contact.schedulerUrl,
    workerName: domain.workerName,
    previewHostSuffix: domain.previewHostSuffix,
    sheetWriter: contact.sheetWriter,
    sheetTabs: contact.sheetTabs,
    autoReply: buildAutoReply(config),
  };
}

/** The Worker's settings, from the real site.config.ts. */
export const workerConfig: WorkerConfig = buildWorkerConfig(siteConfig);
