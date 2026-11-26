// Generates the four files that cannot import site.config.ts, from site.config.ts:
//   wrangler.jsonc, public/_headers, the :root palette in src/app/hl.css, src/lib/fonts.ts.
// `node scripts/sync-config.mjs` writes them; `--check` regenerates in memory and exits 1 with a diff if a committed
// file differs. It never writes anywhere else (never .claude/ or .github/).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { configProblems, wranglerText } from "./config-rules.mjs";

const root = new URL("..", import.meta.url).pathname;
const { siteConfig: c } = await import(pathToFileURL(join(root, "site.config.ts")).href);

// The video sites the video blocks may embed (the single allowlist in src/blocks/embeds.ts).
const { embedOrigins } = await import(pathToFileURL(join(root, "src/blocks/embeds.ts")).href);

const unique = (list) => [...new Set(list)];
const kebab = (key) => key.replace(/([a-z0-9])([A-Z0-9])/g, "$1-$2").toLowerCase();

// The checks on site.config.ts and the secret names (by destination, docs/SECRETS.md) live in config-rules.mjs.
const problems = configProblems(c);
if (problems.length > 0) {
  console.error(`\nConfig check failed: site.config.ts has ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("");
  process.exit(1);
}

const wrangler = () => wranglerText(c);

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
  const frame = unique(["https://challenges.cloudflare.com", ...embedOrigins, ...c.csp.extraFrameSrc]);
  const autoplay = `autoplay=(${embedOrigins.map((origin) => `"${origin}"`).join(" ")})`;
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
# ${embedOrigins.join(", ")} (frame-src, and autoplay in Permissions-Policy): the video and audio blocks
# swap in a player from these sites when a visitor presses play; the list is embedOrigins in src/blocks/embeds.ts.
# The form posts to the same-origin Worker (/api/contact), so form-action stays 'self'.
# These headers apply to static files only; the Worker sets its own headers on /api/* responses.

/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), ${autoplay}, camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains

# PDFs in public/files/ always download and never run on the site's origin (docs/CHANGE-SCOPE.md, "PDF rules").
/files/*
  Content-Disposition: attachment
  Content-Security-Policy: sandbox
  X-Content-Type-Options: nosniff

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

// theme.fonts: `display` is required; `body` and `accent` are optional. Each role present becomes one next/font call
// and one CSS variable (--hl-font-display, --hl-font-body, --hl-font-accent); hl.css falls back to the display font
// for a role that is not set. `fontVariables` is the class list the root layout puts on <html>.
const fontRoles = {
  display: "Display and UI: headings, nav, buttons, labels. Also the body face when no body font is set.",
  body: "Body text.",
  accent: "The second voice.",
};

function fonts() {
  const set = Object.keys(fontRoles).filter((role) => c.theme.fonts[role]);
  if (!set.includes("display")) throw new Error("site.config.ts theme.fonts.display is required");
  const ident = (family) => family.replace(/\s+/g, "_");
  const names = unique(set.map((role) => ident(c.theme.fonts[role].family))).sort();
  const call = (role) => {
    const f = c.theme.fonts[role];
    const lines = ['  subsets: ["latin"],'];
    if (f.weights && f.weights !== "variable") lines.push(`  weight: ${JSON.stringify(f.weights)},`);
    if (f.style) lines.push(`  style: [${JSON.stringify(f.style)}],`);
    if (f.axes?.length) lines.push(`  axes: ${JSON.stringify(f.axes)},`);
    lines.push(`  variable: "--hl-font-${role}",`, '  display: "swap",', "  preload: true,");
    if (role === "display") lines.push('  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],');
    return `/** ${f.family}${f.style ? ` ${f.style}` : ""}. ${fontRoles[role]} */
export const ${role}Font = ${ident(f.family)}({
${lines.join("\n")}
});
`;
  };
  return `import { ${names.join(", ")} } from "next/font/google";

// Fonts (docs/STYLE-GUIDE.md §3), generated from site.config.ts theme.fonts by \`npm run sync:config\`. Each is
// self-hosted at build time by next/font; no third-party font tags.

${set.map(call).join("\n")}
/** The font CSS variables, as class names for <html> (src/app/layout.tsx). */
export const fontVariables = [${set.map((role) => `${role}Font.variable`).join(", ")}].join(" ");
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
