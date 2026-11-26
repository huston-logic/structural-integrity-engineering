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
  domain: { url: string; workerName: string; previewHostSuffix: string; productionBranch?: string };
  /** Optional so an older fixture still compiles; missing means the editor is disabled. */
  editor?: EditorSiteConfig;
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

/** The `editor` block of site.config.ts as the Worker reads it. Optional on WorkerSiteConfig: missing means disabled. */
export interface EditorSiteConfig {
  enabled: boolean;
  ownerEmails: string[];
  access: { teamDomain: string | null; aud: string | null };
  github: {
    owner: string | null;
    repo: string | null;
    appId: string | null;
    installationId: string | null;
    botLogin: string | null;
  };
  workersSubdomain: string | null;
  dailyChangeLimit: number;
  ignoredChecks: string[];
}

/** Everything the owner's chat tools need, resolved once. */
export interface EditorConfig {
  enabled: boolean;
  /** Trimmed and lower-cased. */
  ownerEmails: string[];
  /** `domain.url` without a trailing slash. */
  siteUrl: string;
  /** The hostname of `siteUrl`: the only host the editor answers on. */
  host: string;
  siteName: string;
  workerName: string;
  access: { teamDomain: string | null; aud: string | null };
  github: {
    owner: string | null;
    repo: string | null;
    appId: string | null;
    installationId: string | null;
    botLogin: string | null;
  };
  workersSubdomain: string | null;
  dailyChangeLimit: number;
  ignoredChecks: string[];
  productionBranch: string;
}
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
  editor: EditorConfig;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function buildEditorConfig(config: WorkerSiteConfig): EditorConfig {
  const editor = config.editor;
  const siteUrl = config.domain.url.replace(/\/+$/, "");
  return {
    enabled: editor?.enabled ?? false,
    ownerEmails: (editor?.ownerEmails ?? []).map((email) => email.trim().toLowerCase()),
    siteUrl,
    host: hostOf(siteUrl),
    siteName: config.business.name,
    workerName: config.domain.workerName,
    access: { teamDomain: editor?.access.teamDomain ?? null, aud: editor?.access.aud ?? null },
    github: {
      owner: editor?.github.owner ?? null,
      repo: editor?.github.repo ?? null,
      appId: editor?.github.appId ?? null,
      installationId: editor?.github.installationId ?? null,
      botLogin: editor?.github.botLogin ?? null,
    },
    workersSubdomain: editor?.workersSubdomain ?? null,
    dailyChangeLimit: editor?.dailyChangeLimit ?? 10,
    ignoredChecks: [...(editor?.ignoredChecks ?? [])],
    productionBranch: config.domain.productionBranch ?? "main",
  };
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
    editor: buildEditorConfig(config),
  };
}

/** The Worker's settings, from the real site.config.ts. */
export const workerConfig: WorkerConfig = buildWorkerConfig(siteConfig);
