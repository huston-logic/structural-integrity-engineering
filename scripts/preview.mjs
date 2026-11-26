// Tiny static server for the exported site in ./out (mimics Cloudflare clean URLs, 404.html and text compression).
// Run directly (`npm run preview`) it serves ./out. scripts/change-report.mjs imports startPreviewServer to serve a
// before and an after build side by side.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

// Cloudflare (like `next start`) compresses text responses. Without this, Lighthouse in CI measures about 3x the bytes
// real visitors download, and photo-LCP pages fail the performance threshold for that reason alone.
const compressible = new Set([".html", ".css", ".js", ".json", ".txt", ".xml", ".svg"]);

const defaultOutDir = new URL("../out", import.meta.url).pathname;
const defaultPort = Number(process.env.PORT ?? 4822);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".vcf": "text/vcard; charset=utf-8",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// Apply the site-wide `/*` block of _headers so CSP problems show up locally, not only on Cloudflare, plus blocks for
// one exact path (such as a downloadable file). Wildcard paths other than `/*` and absolute-URL blocks are skipped.
function loadHeaderBlocks(outDir) {
  const file = join(outDir, "_headers");
  const blocks = {};
  if (!existsSync(file)) return blocks;
  let current = null;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (line.startsWith("#") || line.trim() === "") continue;
    if (!line.startsWith(" ")) {
      const pattern = line.trim();
      current = pattern === "/*" || (pattern.startsWith("/") && !pattern.includes("*")) ? (blocks[pattern] = {}) : null;
      continue;
    }
    if (!current) continue;
    const idx = line.indexOf(":");
    current[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
  }
  return blocks;
}

function resolveFile(outDir, pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const candidates = [safe, `${safe}.html`, join(safe, "index.html")];
  for (const c of candidates) {
    const full = join(outDir, c);
    if (full.startsWith(outDir) && existsSync(full) && statSync(full).isFile()) return full;
  }
  return null;
}

/** Starts the server. `port: 0` picks a free port. Resolves to { port, close() } once it is listening. */
export function startPreviewServer({ outDir = defaultOutDir, port = defaultPort } = {}) {
  const headerBlocks = loadHeaderBlocks(outDir);
  const server = createServer((req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    const file = resolveFile(outDir, pathname);
    const status = file ? 200 : 404;
    const target = file ?? join(outDir, "404.html");
    if (!existsSync(target)) {
      res.writeHead(500).end("Run `npm run build` first.");
      return;
    }
    const gzip = compressible.has(extname(target)) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "");
    res.writeHead(status, {
      ...headerBlocks["/*"],
      "content-type": types[extname(target)] ?? "application/octet-stream",
      // Vary on every compressible file, gzipped or not, as Cloudflare does (a cache must not hand the plain copy to a gzip browser).
      ...(compressible.has(extname(target)) ? { vary: "Accept-Encoding" } : undefined),
      ...(gzip ? { "content-encoding": "gzip" } : undefined),
      ...(file ? headerBlocks[pathname] : undefined),
    });
    res.end(gzip ? gzipSync(readFileSync(target)) : readFileSync(target));
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      resolve({ port: server.address().port, close: () => new Promise((done) => server.close(done)) });
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { port } = await startPreviewServer();
  console.log(`Previewing ./out at http://localhost:${port}`);
}
