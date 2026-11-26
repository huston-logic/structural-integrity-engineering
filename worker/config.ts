import { siteConfig } from "../site.config.ts";
import { buildAutoReply, type AutoReply, type AutoReplyConfig } from "../src/content/auto-reply.ts";
import { DEFAULT_FORM_SETTINGS, type FormSettings } from "../src/forms/schema.ts";
import type { UploadsConfig } from "./uploads/types.ts";

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
  /** `timeZone` is optional so an older fixture still compiles; missing means UTC. */
  business: { name: string; tagline: string; timeZone?: string };
  /** Optional so an older fixture still compiles; missing means the editor is disabled. */
  editor?: EditorSiteConfig;
  /** Optional so an older fixture still compiles; missing means the defaults. */
  forms?: FormSettings;
  contact: {
    siteEmail: string | null;
    fromName: string;
    replyFromName: string;
    /** The colors the automatic reply uses inline (`contact.emailColors`); wiring, not read from brand.json. */
    emailColors: { green: string; ink: string; ink2: string; rust: string; line: string };
    sheetWriter: SheetWriter;
    /** `forms` and `formsPreview` are optional so an older fixture still compiles; missing means "Forms" and "Forms preview". */
    sheetTabs: { production: string; preview: string; forms?: string; formsPreview?: string };
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
  /** Optional so an older fixture still compiles; missing means the spec defaults with `enabled` false. */
  uploads?: UploadsConfig;
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
  /** The business's IANA time zone (`business.timeZone`): the day a notice's last day is judged in. */
  timeZone: string;
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
  uploads: UploadsConfig;
}

/** The spec's defaults (docs/superpowers/specs/2026-11-25-uploads-and-photos-design.md, "Settings"). */
export const DEFAULT_UPLOADS: UploadsConfig = {
  enabled: false,
  bucket: null,
  maxPhotoBytes: 20_000_000,
  maxPdfBytes: 10_000_000,
  maxTotalBytes: 200_000_000,
  maxPerDay: 50,
  expireDays: 30,
  types: ["jpeg", "png", "webp", "heic", "pdf"],
};
export interface WorkerConfig {
  businessName: string;
  /** From, notify To and Reply-To. null until the owner sets it: the Worker then refuses to send (worker/contact.ts). */
  siteEmail: string | null;
  fromName: string;
  replyFromName: string;
  workerName: string;
  previewHostSuffix: string;
  sheetWriter: SheetWriter;
  sheetTabs: { production: string; preview: string; forms: string; formsPreview: string };
  destination: Destination;
  /** null when the destination is "sheet" or the owner has not set it. The Worker then saves nothing to the app. */
  pipelineUrl: string | null;
  autoReply: AutoReply;
  forms: FormSettings;
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
    timeZone: config.business.timeZone ?? "UTC",
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
    uploads: { ...DEFAULT_UPLOADS, ...(editor?.uploads ?? {}), types: [...(editor?.uploads?.types ?? DEFAULT_UPLOADS.types)] },
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
    sheetTabs: {
      production: contact.sheetTabs.production,
      preview: contact.sheetTabs.preview,
      forms: contact.sheetTabs.forms ?? "Forms",
      formsPreview: contact.sheetTabs.formsPreview ?? "Forms preview",
    },
    destination: contact.destination ?? "sheet",
    pipelineUrl: contact.pipelineUrl ?? null,
    autoReply: buildAutoReply(config),
    forms: { ...DEFAULT_FORM_SETTINGS, ...(config.forms ?? {}) },
    editor: buildEditorConfig(config),
  };
}

/** The Worker's settings, from the real site.config.ts. */
export const workerConfig: WorkerConfig = buildWorkerConfig(siteConfig);
