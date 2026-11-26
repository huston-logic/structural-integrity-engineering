// The change-scope allow-list: the ONE place that says what a client change may touch. Read by
// scripts/check-change-scope.mjs (and, through it, scripts/change-report.mjs). Full explanation: docs/CHANGE-SCOPE.md.
//
// Tier 1 = content: copy, photos, pages (one JSON file of blocks per page) and the menu labels.
// Tier 3 = everything else (code, settings, security, packages, workflows, blocks). A change that touches any tier 3 file
// stops for Grant, whatever the request said. Editing this file is itself tier 3.
//
// No imports and no TypeScript syntax: plain Node loads it directly.

export const rules = {
  // ---- Tier 1 ---------------------------------------------------------------------------------------------------
  /** A page file: src/content/pages/<name>.json, top level of that folder only, lowercase words joined by hyphens; one -- in the name is the / of a two-level path. */
  pageFile: /^src\/content\/pages\/([a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?)\.json$/,
  /** The folder of page files. Any *.json directly inside it is read for the content check, whatever its name. */
  pagesDir: "src/content/pages/",
  /** Copy modules: src/content/<name>.ts, top level only, no dots in the name (so *.test.ts and *.d.ts are not copy). */
  contentFile: /^src\/content\/[A-Za-z0-9_-]+\.ts$/,
  /** Modules inside src/content that are wiring, not copy: they re-export settings, read process.env or feed the Worker. */
  contentWiring: ["src/content/site.ts", "src/content/providers.ts", "src/content/auto-reply.ts", "src/content/contact-fields.ts"],
  /** Photos live here. Added, changed and deleted files are tier 1, subject to the image rules below. */
  imageDir: "public/images/",
  /** Single files a client change may edit besides the content modules: the menu labels. */
  tier1Files: ["src/content/nav.ts"],
  /**
   * Tier 1 .ts files (content modules, nav.ts) are code that runs at build time, so they are parsed and must be plain data:
   * imports of sibling content modules (or type-only imports), type declarations and `const` values built from literals,
   * arrays and objects. No calls, functions, classes or other statements. A page file is JSON, so it runs nothing; the
   * content check (src/blocks/validate.ts) judges it instead.
   */
  /** Names no tier 1 file may use. Static analysis is best effort; CodeQL and the preview are the other layers. */
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
  /** Why deleting (or renaming) a page file is tier 3. */
  archiveReason: 'pages are archived, not deleted: set its status to "archived" instead',

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
    [/^src\/blocks\/|^src\/site-blocks\//, "a block's design (code)"],
    [/^src\/lib\//, "site code"],
    [/^src\/content\/(site|providers|auto-reply|contact-fields)\.ts$/, "site wiring, not copy"],
    [/^src\/content\/pages\//, "not a page file: a page is src/content/pages/<name>.json, lowercase words joined by hyphens (-- for a /), directly in that folder"],
    [/./, "not on the client-change allow-list"],
  ],
};
