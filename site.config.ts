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
    // The site notice's last day (src/content/notice.json) is judged in this zone at build time. The business's other
    // details (phone, email, address, hours, socials) are in src/content/business.json.
    timeZone: "America/Denver",
  },
  owner: {
    name: "Dylan Gassmann",
    givenName: "Dylan",
    familyName: "Gassmann",
    role: "Principal Engineer",
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
    /**
     * Colors the automatic reply email uses inline (an email cannot read the site's CSS). Wiring, not brand: the values
     * are the Dusk tokens the email has always used, read on a white background: ink is night, ink2 is rule, green is
     * dusk, rust is dusk-deep and line is mist (amber and snow are for the dark site and would fail contrast on white).
     */
    emailColors: { green: "#1C4A50", ink: "#13262B", ink2: "#3D6A70", rust: "#163A40", line: "#C2D6D8" },
    /** Cloudflare Turnstile site key for the contact form. Public by design: it ships in the page. */
    turnstileSiteKey: null as string | null,
    /**
     * Which code saves each submission to the Google Sheet. "apps-script" (the default) posts to a Google Apps Script web
     * app (docs/apps-script/contact-sheet.gs); "service-account" signs in as a Google service account. The choice sets
     * which names wrangler.jsonc lists under secrets.required (see docs/SECRETS.md).
     */
    sheetWriter: "apps-script" as "apps-script" | "service-account",
    /** The tab names in the Sheet: the contact form's two, then the two every other form shares. Generic names; the Apps Script reads the same names from its Script Properties. */
    sheetTabs: { production: "Submissions", preview: "Preview", forms: "Forms", formsPreview: "Forms preview" },
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
   * The caps for the forms owners add (docs/superpowers/specs/2026-11-25-forms-and-downloads-design.md, "Settings").
   * Owner-only file: a chat change can never raise them. `maxForms` counts live form files; `maxAnswerChars` is the most
   * characters one form's fields may allow in all; `maxBodyBytes` is the Worker's body limit for a form post (the contact
   * form keeps its own 16 KB).
   */
  forms: { maxForms: 10, maxFields: 12, maxAnswerChars: 8000, maxBodyBytes: 32_768 },
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
    /**
     * Colors of the owner page (/owner), which the Worker draws itself and so cannot read the site's CSS. Wiring, like
     * contact.emailColors. The values are Dusk mapped onto the page's ten roles (docs/SITE-DIFFERENCES.md, D8;
     * worker/editor/theme.ts `ownerTheme` is the one mapping). `rust` is empty: Dusk has no red that reads on a light
     * page, so the page uses its own dark rust.
     */
    pageColors: {
      white: "#EEF4F4",
      ink: "#13262B",
      ink2: "#163A40",
      silver: "#C2D6D8",
      silver2: "#C2D6D8",
      green: "#1C4A50",
      greenDeep: "#163A40",
      rust: "",
      line: "#3D6A70",
      tint: "#EEF4F4",
    },
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
    // Brand is fixed on this site, so these colors, the font and `brand.logo` stay here and not in src/content/brand.json
    // (docs/SITE-DIFFERENCES.md, D11). Option G, "Dusk" (docs/STYLE-GUIDE.md §2). Each key becomes `--hl-<key>` in src/app/hl.css and a Tailwind color
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
