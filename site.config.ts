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
    oneLiner: "Structural engineering for homes, low-rise commercial buildings and glazing systems in Colorado and Alaska.",
    copyrightYear: 2026,
  },
  owner: {
    name: "Dylan Gassmann",
    givenName: "Dylan",
    familyName: "Gassmann",
    role: "Principal Engineer",
    phone: "(907) 350-3456",
    regionLine: "Colorado and Alaska",
  },
  domain: {
    url: "https://structural-integrity-engineering.com",
    // The Cloudflare Worker's name (wrangler.jsonc `name`). The contact Worker also uses it to tell the production
    // workers.dev host from branch previews.
    workerName: "structural-integrity-engineering",
    previewHostSuffix: ".workers.dev",
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
    bookingFallbackPath: "/contact#book",
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
    rateLimit: {
      limit: 5,
      periodSeconds: 60,
      // Integer strings unique per Cloudflare account.
      namespaceIds: { production: "1001", preview: "1002" },
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
    logo: "",
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
