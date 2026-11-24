// Generates the four files that cannot import site.config.ts, from site.config.ts:
//   wrangler.jsonc, public/_headers, the :root palette in src/app/hl.css, src/lib/fonts.ts.
// `node scripts/sync-config.mjs` writes them; `--check` regenerates in memory and exits 1 with a diff if a committed
// file differs. It never writes anywhere else (never .claude/ or .github/).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url).pathname;
const { siteConfig: c } = await import(pathToFileURL(join(root, "site.config.ts")).href);

const unique = (list) => [...new Set(list)];
const kebab = (key) => key.replace(/([a-z0-9])([A-Z0-9])/g, "$1-$2").toLowerCase();

// Secret names the contact Worker needs, by Sheet writer (docs/SECRETS.md). Names only, never values.
const secretsByWriter = {
  "apps-script": ["RESEND_API_KEY", "TURNSTILE_SECRET_KEY", "SHEET_WEBHOOK_URL", "SHEET_WEBHOOK_SECRET"],
  "service-account": ["RESEND_API_KEY", "TURNSTILE_SECRET_KEY", "GOOGLE_SERVICE_ACCOUNT_KEY", "GOOGLE_SHEET_ID"],
};

function wrangler() {
  const { limit, periodSeconds, namespaceIds } = c.contact.rateLimit;
  const secrets = secretsByWriter[c.contact.sheetWriter];
  if (!secrets) {
    throw new Error(`site.config.ts contact.sheetWriter must be "apps-script" or "service-account", not ${JSON.stringify(c.contact.sheetWriter)}`);
  }
  const rate = (id) =>
    `[{ "name": "CONTACT_RATE_LIMIT", "namespace_id": "${id}", "simple": { "limit": ${limit}, "period": ${periodSeconds} } }]`;
  return `{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "${c.domain.workerName}",
  // The contact form Worker. It runs only for /api/* (run_worker_first); every page and file is served from ./out.
  "main": "./worker/contact.ts",
  "compatibility_date": "2026-11-11",
  "assets": {
    "directory": "./out",
    "not_found_handling": "404-page",
    "run_worker_first": ["/api/*"]
  },
  "vars": { "SITE_ENV": "production" },
  // Names only. Values are set with \`wrangler secret put\` (README, "Contact form").
  "secrets": {
    "required": [${secrets.map((name) => `"${name}"`).join(", ")}]
  },
  "ratelimits": ${rate(namespaceIds.production)},
  // Invocation logs would store request metadata; the Worker's own log lines hold no personal data.
  "observability": { "enabled": true, "logs": { "invocation_logs": false } },
  // Worker Previews (branch previews) do not inherit the settings above, so they are repeated here.
  // Preview secrets are separate: \`wrangler preview base-config secret put\`.
  "previews": {
    "vars": { "SITE_ENV": "preview" },
    "ratelimits": ${rate(namespaceIds.preview)}
  }
}
`;
}

function headers() {
  const insights = c.analytics.cloudflareWebAnalytics;
  const script = unique([
    "'self'",
    "'unsafe-inline'",
    "https://challenges.cloudflare.com",
    ...(insights ? ["https://static.cloudflareinsights.com"] : []),
    ...c.csp.extraScriptSrc,
  ]);
  const connect = unique(["'self'", ...(insights ? ["https://cloudflareinsights.com"] : []), ...c.csp.extraConnectSrc]);
  const frame = unique(["https://challenges.cloudflare.com", ...c.csp.extraFrameSrc]);
  const csp = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connect.join(" ")}`,
    `frame-src ${frame.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  return `# Cloudflare response headers (Pages and Workers static assets).
# https://developers.cloudflare.com/pages/configuration/headers/
# https://developers.cloudflare.com/workers/static-assets/headers/
# Next.js static export emits inline bootstrap scripts, so script-src needs 'unsafe-inline'.
# Tighten (hashes or nonces) if the hosting setup ever allows it. Update frame-src/script-src/connect-src
# when a scheduler or form provider is added.
# https://challenges.cloudflare.com (script-src, frame-src): Cloudflare Turnstile on the contact form.
# https://static.cloudflareinsights.com (script-src) and https://cloudflareinsights.com (connect-src): Cloudflare Web Analytics.
# The form posts to the same-origin Worker (/api/contact), so form-action stays 'self'.
# These headers apply to static files only; the Worker sets its own headers on /api/* responses.

/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# Keep Cloudflare preview/production *.pages.dev URLs out of search results.
https://:project.pages.dev/*
  X-Robots-Tag: noindex

# Same for *.workers.dev worker and preview URLs.
https://:version.:subdomain.workers.dev/*
  X-Robots-Tag: noindex
`;
}

function hlCss() {
  const file = join(root, "src/app/hl.css");
  let css = readFileSync(file, "utf8");
  for (const [key, value] of Object.entries(c.theme.colors)) {
    const re = new RegExp(`^(  --hl-${kebab(key)}: )[^;]+;`, "m");
    if (!re.test(css)) throw new Error(`src/app/hl.css has no --hl-${kebab(key)} token for theme.colors.${key}`);
    css = css.replace(re, `$1${value};`);
  }
  return css;
}

function fonts() {
  const { display, body, accent } = c.theme.fonts;
  const ident = (family) => family.replace(/\s+/g, "_");
  const weight = (f) => (f.weights && f.weights !== "variable" ? `\n  weight: ${JSON.stringify(f.weights)},` : "");
  const names = [display, body, accent].map((f) => ident(f.family)).sort();
  return `import { ${names.join(", ")} } from "next/font/google";

// Design v3 fonts (docs/STYLE-GUIDE.md §3). Each is self-hosted at build time by next/font; no third-party font tags.
// Preloaded: ${display.family} (header and every heading) and ${body.family} (body) render above the fold on every page.

/** Display and UI: headings, nav, buttons, eyebrows, labels. One variable file (wght 100 to 900). */
export const outfit = ${ident(display.family)}({
  subsets: ["latin"],${weight(display)}
  variable: "--hl-outfit",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/** Body text. One variable file. */
export const inter = ${ident(body.family)}({
  subsets: ["latin"],${weight(body)}
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

/** The second voice: ${accent.family} ${accent.style} only, never roman. */
export const newsreader = ${ident(accent.family)}({
  subsets: ["latin"],
  style: [${JSON.stringify(accent.style)}],${accent.axes?.length ? `\n  axes: ${JSON.stringify(accent.axes)},` : ""}
  variable: "--font-newsreader",
  display: "swap",
  preload: true,
});
`;
}

const generated = {
  "wrangler.jsonc": wrangler(),
  "public/_headers": headers(),
  "src/app/hl.css": hlCss(),
  "src/lib/fonts.ts": fonts(),
};

function diff(expected, actual) {
  const a = actual.split("\n");
  const e = expected.split("\n");
  const out = [];
  for (let i = 0; i < Math.max(a.length, e.length) && out.length < 12; i++) {
    if (a[i] !== e[i]) {
      out.push(`    line ${i + 1}`, `      committed: ${a[i] ?? "(missing)"}`, `      generated: ${e[i] ?? "(missing)"}`);
    }
  }
  return out.join("\n");
}

if (process.argv.includes("--check")) {
  const drifted = [];
  for (const [path, expected] of Object.entries(generated)) {
    const file = join(root, path);
    const actual = existsSync(file) ? readFileSync(file, "utf8") : "";
    if (actual !== expected) drifted.push(`  - ${path}\n${diff(expected, actual)}`);
  }
  if (drifted.length > 0) {
    console.error(`\nConfig check failed: ${drifted.length} generated file(s) differ from site.config.ts\n`);
    console.error(drifted.join("\n\n"));
    console.error("\nRun `npm run sync:config` and commit the result.\n");
    process.exit(1);
  }
  console.log("Config check passed: generated files match site.config.ts.");
} else {
  for (const [path, content] of Object.entries(generated)) {
    const file = join(root, path);
    if (!existsSync(file) || readFileSync(file, "utf8") !== content) {
      writeFileSync(file, content);
      console.log(`wrote ${path}`);
    } else {
      console.log(`unchanged ${path}`);
    }
  }
}
