/**
 * Every per-client value for the site, in one place. This file imports nothing, so the Next.js site, the contact Worker
 * and plain Node scripts (scripts/sync-config.mjs, scripts/check-placeholders.mjs) can all read it.
 *
 * Four files cannot import TypeScript and are generated from this file: wrangler.jsonc, public/_headers, the :root
 * palette in src/app/hl.css and src/lib/fonts.ts. After editing a value that feeds one of them, run
 * `npm run sync:config` and commit the result; `npm run check:config` fails if they drift.
 *
 * Unknown values are written as [[double-bracket placeholders]]; `npm run build:launch` fails on any left in this file.
 */
export const siteConfig = {
  business: {
    name: "Structural Integrity Engineering",
    /** Optional. Empty means the business name is used. */
    legalName: "Structural Integrity Engineering, Inc.",
    tagline: "Strength you can build on.",
    /** The positioning line. Feeds the JSON-LD description. */
    oneLiner: "Structural engineering for homes, low-rise commercial buildings and glazing systems in Colorado.",
    copyrightYear: 2026,
  },
  owner: {
    name: "Dylan Gassmann",
    givenName: "Dylan",
    familyName: "Gassmann",
    role: "Principal Engineer",
    phone: "(907) 350-3456",
    regionLine: "Colorado",
  },
  domain: {
    url: "https://structural-integrity-engineering.com",
    // The Cloudflare Worker's name (wrangler.jsonc `name`). The contact Worker also uses it to tell the production
    // workers.dev host from branch previews.
    workerName: "structural-integrity-engineering",
    previewHostSuffix: ".workers.dev",
    // The branch Workers Builds deploys to production. scripts/finish-build.mjs drops the /blocks showcase from builds of this branch.
    productionBranch: "main",
  },
  contact: {
    // From, notify To and Reply-To. null means not set yet: check:placeholders fails, and the contact Worker refuses to
    // send (502) until it is set.
    siteEmail: "dylan@structural-integrity-engineering.com" as string | null,
    /** Display name on the notification email. */
    fromName: "Structural Integrity Engineering website",
    /** Display name on the automatic reply. */
    replyFromName: "Dylan Gassmann",
    // CLIENT: replace. A booking URL (add its origin to csp.extraFrameSrc if it is embedded), or "none" when there is no
    // booking link: pages leave out every book-a-call button and the contact page's scheduler column, and the automatic
    // reply leaves out its booking paragraph and signature line. null means not decided yet: check:placeholders fails, the
    // contact page shows a placeholder, and the contact Worker refuses to send (502).
    schedulerUrl: "none" as string | null,
    bookingFallbackPath: "/contact-us#book",
    // CLIENT: replace. A LinkedIn URL, or "none" when there is no page to link: the footer leaves the link out. null means
    // not decided yet; check:placeholders fails while it is null.
    linkedInUrl: "none" as string | null,
    /** Cloudflare Turnstile site key for the contact form. Public by design: it ships in the page. */
    turnstileSiteKey: null as string | null,
    /**
     * Which code saves each submission to the Google Sheet. "apps-script" (the default) posts to a Google Apps Script web
     * app (docs/apps-script/contact-sheet.gs); "service-account" signs in as a Google service account. The choice sets
     * which names wrangler.jsonc lists under secrets.required (see docs/SECRETS.md).
     */
    sheetWriter: "apps-script" as "apps-script" | "service-account",
    /** The two tab names in the Sheet. Generic names; the Apps Script reads the same two names from its Script Properties. */
    sheetTabs: { production: "Submissions", preview: "Preview" },
    /**
     * Where each submission is saved. "sheet" (the default) is the Google Sheet above, the fallback. "pipeline" posts it
     * server to server to the client's Pipeline app copy (`pipelineUrl` + "/intake", secret INTAKE_SECRET). The notification
     * email goes to `siteEmail` either way. Which secrets are required follows this setting (`npm run sync:config`).
     * Another tool the client names is not built; its one place in the code is `saveSubmission` in worker/contact.ts.
     */
    destination: "sheet" as "sheet" | "pipeline",
    /** The Pipeline app copy's https origin, such as "https://pipeline.example.com" (no path). Needed when destination is "pipeline". */
    pipelineUrl: null as string | null,
    rateLimit: {
      limit: 5,
      periodSeconds: 60,
    },
    // Two whole numbers written as strings, unique to this site in its Cloudflare account: bindings with the same id
    // share counters, even across Workers. This site's pair is in docs/HOSTING.md. 1001 and 1002 are the template's own;
    // `npm run check:config` rejects them on a real site.
    rateLimitIds: { production: "2201", preview: "2202" },
  },
  /**
   * The owner's chat tools (docs/EDITING.md). Off by default: while `enabled` is false the Worker answers only /api/*
   * and wrangler.jsonc gets none of the editor bindings. Owner-only file: a chat change can never add an owner.
   */
  editor: {
    enabled: false,
    /** Who may sign in. Lower-cased when compared. Removing someone takes effect at the next deploy. */
    ownerEmails: [] as string[],
    /** Cloudflare Access: the team name only (for <team>.cloudflareaccess.com) and the Access app's AUD tag. Not secrets. */
    access: { teamDomain: null as string | null, aud: null as string | null },
    /** The GitHub App installed on this site's repo only. appId and installationId are digits written as strings. */
    github: {
      owner: "huston-logic" as string | null,
      repo: "structural-integrity-engineering" as string | null,
      appId: null as string | null,
      installationId: null as string | null,
      botLogin: null as string | null,
    },
    /** The account's workers.dev subdomain, used to compute preview links. */
    workersSubdomain: null as string | null,
    dailyChangeLimit: 10,
    /** A whole number written as a string, unique in the Cloudflare account (docs/HOSTING.md). 2203 is reserved for this site. */
    rateLimitId: "2203",
    /** KV namespace ids (32 hex characters): OAuth tokens, and drafts with change times. */
    kv: { oauth: null as string | null, editor: null as string | null },
    /** Pull request checks that never count when judging whether a change is stuck. */
    ignoredChecks: ["change-report", "change-scope", "Workers Builds"] as string[],
    /**
     * The owner's upload inbox (photos and PDFs). Settings and their reasons: docs/superpowers/specs/2026-11-25-uploads-and-photos-design.md
     * ("Settings"). Needs a private R2 bucket and the Images binding, so it stays off until that setup is done.
     */
    uploads: {
      enabled: false,
      bucket: null as string | null,
      maxPhotoBytes: 20_000_000,
      maxPdfBytes: 10_000_000,
      maxTotalBytes: 200_000_000,
      maxPerDay: 50,
      expireDays: 30,
      types: ["jpeg", "png", "webp", "heic", "pdf"] as ("jpeg" | "png" | "webp" | "heic" | "pdf")[],
    },
  },
  theme: {
    // Option G, "Dusk" (docs/STYLE-GUIDE.md §2). Each key becomes `--hl-<key>` in src/app/hl.css and a Tailwind color
    // (`bg-dusk`, `text-snow`, `border-rule` ...). Contrast on dusk: snow 9.2:1, mist 6.8:1, amber 5.5:1, error 6.0:1;
    // night on amber 8.5:1. `rule` is decorative only (1.7:1), never a text or control-boundary color.
    colors: {
      dusk: "#1C4A50",
      duskDeep: "#163A40",
      night: "#13262B",
      snow: "#EEF4F4",
      mist: "#C2D6D8",
      amber: "#F2B266",
      rule: "#3D6A70",
      error: "#FFB3A6",
    },
    // next/font/google families. `weights: "variable"` loads the one variable file. `display` is required; `body` and
    // `accent` are optional and fall back to `display`. The OG fonts in src/assets/og must match the display family.
    fonts: {
      display: { family: "Manrope", weights: "variable" },
    },
  },
  brand: {
    /** Optional. Site-relative path to the logo image, such as "/brand/logo.png". Empty means none (not a launch blocker). */
    logo: "/brand/sie-logo.svg",
  },
  /** Published price text. Empty means none is published (not a launch blocker). */
  prices: { website: "" },
  /** Extra origins appended to the CSP in public/_headers. */
  csp: {
    extraScriptSrc: [] as string[],
    extraConnectSrc: [] as string[],
    extraFrameSrc: [] as string[],
  },
  analytics: { cloudflareWebAnalytics: true },
} as const;
