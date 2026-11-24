// The change-scope allow-list: the ONE place that says what a client change may touch. Read by
// scripts/check-change-scope.mjs (and, through it, scripts/change-report.mjs). Full explanation: docs/CHANGE-SCOPE.md.
//
// Tier 1 = content: copy, photos, a new page built from blocks the site already has, the page list and the menu.
// Tier 3 = everything else (code, settings, security, packages, workflows). A change that touches any tier 3 file
// stops for Grant, whatever the request said. Editing this file is itself tier 3.
//
// No imports and no TypeScript syntax: plain Node loads it directly.

export const rules = {
  // ---- Tier 1 ---------------------------------------------------------------------------------------------------
  /** Copy modules: src/content/<name>.ts, top level only, no dots in the name (so *.test.ts and *.d.ts are not copy). */
  contentFile: /^src\/content\/[A-Za-z0-9_-]+\.ts$/,
  /** Modules inside src/content that are wiring, not copy: they re-export settings, read process.env or feed the Worker. */
  contentWiring: ["src/content/site.ts", "src/content/providers.ts", "src/content/auto-reply.ts"],
  /** Photos live here. Added, changed and deleted files are tier 1, subject to the image rules below. */
  imageDir: "public/images/",
  /** Single files a client change may edit: the route list and the menu. */
  tier1Files: ["src/lib/routes.ts", "src/content/nav.ts"],
  /** A brand-new page: exactly src/app/(site)/<name>/page.tsx, one folder deep, lowercase name. */
  pagePath: /^src\/app\/\(site\)\/([a-z0-9-]+)\/page\.tsx$/,
  /**
   * Tier 1 .ts files (content modules, routes.ts, nav.ts) are code that runs at build time, so they are parsed and must
   * be plain data: imports of sibling content modules (or type-only imports), type declarations and `const` values built
   * from literals, arrays and objects. No calls, functions, classes or other statements.
   */
  /** What a new page may import: next (for the Metadata type), src/content modules, @/lib/metadata and components that already exist. */
  pageImports: { exact: ["next", "@/lib/metadata"], contentPrefix: "@/content/", componentPrefix: "@/components/" },
  /** Names no tier 1 file or new page may use. Static analysis is best effort; CodeQL and the preview are the other layers. */
  denyIdentifiers: [
    "eval", "Function", "setTimeout", "setInterval", "setImmediate", "queueMicrotask", "require", "process", "globalThis",
    "global", "window", "self", "document", "navigator", "location", "localStorage", "sessionStorage", "indexedDB", "fetch",
    "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker", "WebAssembly", "Reflect", "Proxy", "Atomics",
    "module", "exports", "__dirname", "__filename", "Buffer", "importScripts", "dangerouslySetInnerHTML", "srcDoc",
  ],
  /** Property names that reach the Function constructor or the prototype chain. */
  denyProperties: ["constructor", "__proto__", "prototype"],
  /** Method names that turn any function value into a generic call primitive. Denied when READ (x.call) or destructured, not as data keys. */
  denyMethodReads: ["call", "apply", "bind", "__lookupGetter__", "__lookupSetter__", "__defineGetter__", "__defineSetter__"],
  /** JSX tags a new page may not use. */
  denyJsxTags: ["script", "Script", "iframe", "object", "embed", "style", "base", "link", "meta", "form"],
  /** A new page must use the shared metadata helper... */
  pageRequires: ["pageMetadata("],
  /** ...and must not contain any of these (client code, raw HTML, network calls, secrets, dynamic code). */
  pageForbidden: ['"use client"', "'use client'", "dangerouslySetInnerHTML", "<script", "<iframe", "fetch(", "process.env", "eval(", "import("],

  // ---- Flags: the change still passes, but Grant is told -------------------------------------------------------------
  /** Dollar amounts: a $ followed by a digit, or a number followed by USD or dollars. */
  dollarPatterns: [/\$\s?\d/, /\b\d[\d,]*(?:\.\d+)?\s?(?:USD|dollars?)\b/i],
  /** Contact details: email addresses, mailto:/tel: links, US-style and international (+...) phone numbers. */
  contactPatterns: [/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/, /\b(?:mailto|tel):/i, /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/, /\+\d[\d\s().-]{8,}\d/],
  /** Booking links: a link (with or without https://) on one of these hosts. */
  schedulerHosts: ["calendly.com", "cal.com", "savvycal.com", "tidycal.com", "acuityscheduling.com", "youcanbook.me", "zcal.co", "calendar.app.google"],
  /** Files whose every change is flagged (legal text and the contact form's questions). */
  sensitiveFiles: ["src/content/privacy.ts", "src/content/contact-fields.ts"],
  /** Size limits. A change over either one is flagged. */
  maxChangedLines: 300,
  maxFiles: 10,

  // ---- Image rules (blocking on change branches) -------------------------------------------------------------------
  /** Extension, with the first bytes the file must start with. SVG is never allowed: it can carry code. */
  imageTypes: {
    ".jpg": "jpeg",
    ".jpeg": "jpeg",
    ".png": "png",
    ".webp": "webp",
  },
  maxImageBytes: 500 * 1024,
  /**
   * Hidden camera, location and editing data (EXIF, XMP, IPTC, comments, thumbnails) must be gone from every added or changed
   * image. `npm run strip:images` removes it (scripts/strip-image-metadata.mjs); scripts/image-metadata.mjs says what counts.
   */
  /** Every added or changed image must be used with alt text written next to it. These words say nothing, so they do not count. */
  genericAltText: ["image", "img", "photo", "picture", "graphic", "icon", "logo", "alt", "alt text", "todo", "tbd", "untitled", "placeholder"],
  /** Where an image's URL (such as /images/team/sam.jpg) is looked for, to find the alt text beside it. */
  imageReferenceDir: "src",

  // ---- Leftover placeholders (blocking on change branches) ---------------------------------------------------------
  /** Same folders, file types and pattern as scripts/check-placeholders.mjs; only lines ADDED by the change count. */
  placeholderDirs: ["src/content/", "src/app/"],
  placeholderFiles: /\.(ts|tsx|md|mdx|json)$/,
  placeholderPattern: /\[\[([^\]]+)\]\]/g,

  // ---- Plain-English reasons shown for tier 3 files. First match wins; the last entry is the catch-all. ----------------
  tier3Labels: [
    [/^worker\//, "the contact form's server code"],
    [/^public\/_headers$/, "the security headers"],
    [/^public\/_redirects$/, "the redirect rules"],
    [/^wrangler\.jsonc$/, "the deploy settings"],
    [/^site\.config\.ts$/, "the site settings"],
    [/^package(-lock)?\.json$/, "the package list"],
    [/^\.github\//, "the CI workflows"],
    [/^\.claude\//, "the Claude hooks and agents"],
    [/^src\/components\//, "a shared component"],
    [/^src\/content\/(site|providers|auto-reply)\.ts$/, "site wiring, not copy"],
    [/^src\/app\/\(site\)\/[^/]+\/page\.tsx$/, "an existing page (only brand-new pages are allowed)"],
    [/./, "not on the client-change allow-list"],
  ],
};
