// Tests for the contact Worker, run with Node's built-in test runner (`npm run test:worker`). `fetch` is replaced by a
// recorder, so nothing reaches Turnstile, Resend, Google or an Apps Script web app. The Worker is built from a fixture
// config (obviously fake values), never the real site.config.ts. A throwaway RSA key stands in for the service-account key.
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { buildAutoReply } from "../src/content/auto-reply.ts";
import { appendRowViaAppsScript } from "./apps-script.ts";
import { buildWorkerConfig, type WorkerSiteConfig } from "./config.ts";
import { createWorker } from "./contact.ts";
import type { ContactEnv } from "./env.ts";
import { resolveMode } from "./env.ts";
import { resetTokenCache, safeCell, signAssertion } from "./sheets.ts";
import { firstName } from "../src/lib/first-name.ts";
import { validateContact } from "../src/lib/contact-validation.ts";

type Call = { url: string; init: RequestInit; json: Record<string, unknown> | null };

const FIXTURE: WorkerSiteConfig = {
  business: { name: "Example Co", tagline: "Plain words for plain work" },
  owner: { name: "Pat Example", role: "Founder" },
  domain: { url: "https://example.test", workerName: "example-site", previewHostSuffix: ".workers.dev" },
  contact: {
    siteEmail: "hello@example.test",
    fromName: "Example Co",
    replyFromName: "Pat Example",
    schedulerUrl: "https://example.test/book",
    sheetWriter: "service-account",
    sheetTabs: { production: "Submissions", preview: "Preview" },
  },
  theme: { colors: { green: "#112233", ink: "#223344", ink2: "#334455", rust: "#445566", line: "#556677" } },
};

function makeWorker(contact: Partial<WorkerSiteConfig["contact"]> = {}, domain: Partial<WorkerSiteConfig["domain"]> = {}) {
  return createWorker(buildWorkerConfig({ ...FIXTURE, domain: { ...FIXTURE.domain, ...domain }, contact: { ...FIXTURE.contact, ...contact } }));
}

// Most tests use the service-account writer (the original Google Sheets API path); the apps-script suite further down
// uses `appsWorker`.
const worker = makeWorker();
const appsWorker = makeWorker({ sheetWriter: "apps-script" });

const SITE_EMAIL = "hello@example.test";
const BOOKING = "https://example.test/book";
const ORIGIN = "https://example.test";
const PREVIEW_HOST = "feat-x-example-site.acct.workers.dev";
const WEBHOOK_URL = "https://script.google.com/macros/s/EXAMPLE_DEPLOYMENT_ID/exec";
const WEBHOOK_SECRET = "webhook-test-secret";
const VISITOR = { name: "Ada Lovelace", email: "ada@example.org", message: "Inquiries get lost between three inboxes." };

let calls: Call[] = [];
let logs: string[] = [];
let responders: Record<string, () => Response>;
const realFetch = globalThis.fetch;
const realLog = console.log;
let keyPair: CryptoKeyPair;
let serviceAccountKey = "";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function defaultResponders(): Record<string, () => Response> {
  return {
    siteverify: () => jsonResponse({ success: true, hostname: "example.test", action: "contact" }),
    token: () => jsonResponse({ access_token: "test-access-token", expires_in: 3600 }),
    sheets: () => jsonResponse({ updates: { updatedRows: 1 } }),
    webhook: () => jsonResponse({ ok: true }),
    notify: () => jsonResponse({ id: "email-1" }),
    reply: () => jsonResponse({ id: "email-2" }),
  };
}

function route(url: string, init: RequestInit): string {
  if (url.includes("turnstile/v0/siteverify")) return "siteverify";
  if (url.startsWith("https://oauth2.googleapis.com/token")) return "token";
  if (url.startsWith("https://sheets.googleapis.com/")) return "sheets";
  if (url.startsWith("https://script.google.com/")) return "webhook";
  if (url === "https://api.resend.com/emails") {
    return String((init.headers as Record<string, string>)["idempotency-key"]).endsWith("-notify") ? "notify" : "reply";
  }
  throw new Error(`Unexpected fetch: ${url}`);
}

function toPem(der: ArrayBuffer): string {
  const base64 = Buffer.from(der).toString("base64").replace(/(.{64})/g, "$1\n");
  return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----\n`;
}

function env(overrides: Partial<ContactEnv> = {}, allowed = true): ContactEnv {
  return {
    SITE_ENV: "production",
    RESEND_API_KEY: "re_test",
    TURNSTILE_SECRET_KEY: "turnstile-test-secret",
    GOOGLE_SERVICE_ACCOUNT_KEY: serviceAccountKey,
    GOOGLE_SHEET_ID: "sheet-123",
    SHEET_WEBHOOK_URL: WEBHOOK_URL,
    SHEET_WEBHOOK_SECRET: WEBHOOK_SECRET,
    CONTACT_RATE_LIMIT: { limit: async () => ({ success: allowed }) },
    ...overrides,
  };
}

function post(body: unknown, { origin = ORIGIN, contentType = "application/json", url = `${ORIGIN}/api/contact`, raw }: { origin?: string; contentType?: string; url?: string; raw?: string } = {}): Request {
  return new Request(url, {
    method: "POST",
    headers: { origin, "content-type": contentType, "sec-fetch-site": "same-origin", "cf-connecting-ip": "203.0.113.9" },
    body: raw ?? JSON.stringify(body),
  });
}

const valid = { need: "website", topic: "", name: VISITOR.name, email: VISITOR.email, business: "", message: VISITOR.message, tools: "", website: "", source: "Google", company_fax: "", turnstileToken: "token-abc" };

function called(kind: string): Call[] {
  return calls.filter((c) => route(c.url, c.init) === kind);
}

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

beforeEach(async () => {
  calls = [];
  logs = [];
  responders = defaultResponders();
  resetTokenCache();
  keyPair ??= (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  serviceAccountKey ||= JSON.stringify({ client_email: "writer@test.iam.gserviceaccount.com", private_key: toPem((await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)) as ArrayBuffer) });
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    let json: Record<string, unknown> | null = null;
    if (typeof init.body === "string") {
      try {
        json = JSON.parse(init.body) as Record<string, unknown>;
      } catch {
        json = null;
      }
    }
    calls.push({ url, init, json });
    return responders[route(url, init)]();
  }) as typeof fetch;
  console.log = (...args: unknown[]) => logs.push(args.join(" "));
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.log = realLog;
  // No log line may ever hold what the visitor typed.
  for (const line of logs) {
    for (const secret of [VISITOR.name, VISITOR.email, VISITOR.message, "203.0.113.9", "re_test", "turnstile-test-secret", WEBHOOK_SECRET, "EXAMPLE_DEPLOYMENT_ID", "script.google.com"]) {
      assert.ok(!line.includes(secret), `log line leaked "${secret}": ${line}`);
    }
  }
});

describe("routing", () => {
  test("other paths are 404 and other methods are 405", async () => {
    assert.equal((await worker.fetch(new Request(`${ORIGIN}/api/other`), env())).status, 404);
    const get = await worker.fetch(new Request(`${ORIGIN}/api/contact`), env());
    assert.equal(get.status, 405);
    assert.equal(get.headers.get("allow"), "POST");
    assert.equal(get.headers.get("cache-control"), "no-store");
    assert.equal(calls.length, 0);
  });
});

describe("requests rejected before any outside call", () => {
  const cases: [string, () => Request, number, string][] = [
    ["another origin", () => post(valid, { origin: "https://evil.example" }), 403, "rejected"],
    ["form-encoded body", () => post(valid, { contentType: "application/x-www-form-urlencoded" }), 415, "rejected"],
    ["body over 16 KB", () => post({ ...valid, message: "x".repeat(17000) }), 413, "rejected"],
    ["broken JSON", () => post(null, { raw: "{" }), 400, "rejected"],
    ["unknown key", () => post({ ...valid, extra: "1" }), 400, "rejected"],
    ["filled honeypot", () => post({ ...valid, company_fax: "555-0100" }), 400, "rejected"],
    ["missing name", () => post({ ...valid, name: "  " }), 400, "invalid"],
    ["bad email", () => post({ ...valid, email: "ada@" }), 400, "invalid"],
    ["unknown need", () => post({ ...valid, need: "logo" }), 400, "rejected"],
    ["over-long business", () => post({ ...valid, business: "b".repeat(201) }), 400, "rejected"],
    ["missing token", () => post({ ...valid, turnstileToken: "" }), 403, "rejected"],
  ];
  for (const [label, request, status, error] of cases) {
    test(label, async () => {
      const response = await worker.fetch(request(), env());
      assert.equal(response.status, status);
      assert.equal((await bodyOf(response)).error, error);
      assert.equal(calls.length, 0);
    });
  }

  test("field errors name the fields", async () => {
    const response = await worker.fetch(post({ ...valid, need: "", name: "", email: "x", message: "" }), env());
    assert.deepEqual((await bodyOf(response)).fields, ["need", "name", "email", "message"]);
  });

  test("rate limited", async () => {
    const response = await worker.fetch(post(valid), env({}, false));
    assert.equal(response.status, 429);
    assert.equal((await bodyOf(response)).error, "rate_limited");
    assert.equal(calls.length, 0);
  });

  test("an unknown SITE_ENV fails closed", async () => {
    const response = await worker.fetch(post(valid), env({ SITE_ENV: "staging" }));
    assert.equal(response.status, 500);
    assert.equal(calls.length, 0);
  });
});

describe("Turnstile", () => {
  test("a failed check sends nothing", async () => {
    responders.siteverify = () => jsonResponse({ success: false, "error-codes": ["invalid-input-response"] });
    const response = await worker.fetch(post(valid), env());
    assert.equal(response.status, 403);
    assert.deepEqual(calls.map((c) => route(c.url, c.init)), ["siteverify"]);
  });

  test("a token from another hostname or action is refused", async () => {
    responders.siteverify = () => jsonResponse({ success: true, hostname: "other.example", action: "contact" });
    assert.equal((await worker.fetch(post(valid), env())).status, 403);
    responders.siteverify = () => jsonResponse({ success: true, hostname: "example.test", action: "login" });
    assert.equal((await worker.fetch(post(valid), env())).status, 403);
    assert.ok(logs.some((l) => l.includes('"reason":"hostname_mismatch"')));
    assert.ok(logs.some((l) => l.includes('"reason":"action_mismatch"')));
  });

  test("a missing Turnstile secret is our failure (502), not the visitor's, and calls nothing", async () => {
    const response = await worker.fetch(post(valid), env({ TURNSTILE_SECRET_KEY: undefined }));
    assert.equal(response.status, 502);
    assert.equal((await bodyOf(response)).error, "failed");
    assert.equal(calls.length, 0);
    assert.ok(logs.some((l) => l.includes("turnstile_config_missing")));
  });

  test("a secret Cloudflare refuses, or an unreachable siteverify, is our failure (502)", async () => {
    responders.siteverify = () => jsonResponse({ success: false, "error-codes": ["invalid-input-secret"] });
    const refused = await worker.fetch(post(valid), env());
    assert.equal(refused.status, 502);
    assert.equal((await bodyOf(refused)).error, "failed");
    assert.ok(logs.some((l) => l.includes("turnstile_unavailable") && l.includes("invalid-input-secret")));
    responders.siteverify = () => jsonResponse({}, 500);
    assert.equal((await worker.fetch(post(valid), env())).status, 502);
    assert.deepEqual(calls.map((c) => route(c.url, c.init)), ["siteverify", "siteverify"]);
  });

  test("the secret, token and IP go to siteverify", async () => {
    await worker.fetch(post(valid), env());
    const [verify] = called("siteverify");
    assert.equal(verify.json?.secret, "turnstile-test-secret");
    assert.equal(verify.json?.response, "token-abc");
    assert.equal(verify.json?.remoteip, "203.0.113.9");
  });
});

describe("a good submission in production", () => {
  test("saves the row, emails the site owner and sends the B7b auto-reply, all plain text", async () => {
    const response = await worker.fetch(post({ ...valid, business: "=HYPERLINK(\"x\")" }), env());
    assert.equal(response.status, 200);
    assert.deepEqual(await bodyOf(response), { ok: true, autoReply: true });

    const [append] = called("sheets");
    assert.match(append.url, /\/spreadsheets\/sheet-123\/values\/Submissions!A%3AK:append\?valueInputOption=RAW&insertDataOption=INSERT_ROWS$/);
    const row = (append.json?.values as string[][])[0];
    assert.equal(row.length, 11);
    assert.deepEqual(row.slice(1, 6), ["A website", "", VISITOR.name, VISITOR.email, "'=HYPERLINK(\"x\")"]);
    assert.equal(row[10], "production");

    const [notify] = called("notify");
    assert.deepEqual(notify.json?.to, [SITE_EMAIL]);
    assert.equal(notify.json?.from, `Example Co <${SITE_EMAIL}>`);
    assert.equal(notify.json?.reply_to, VISITOR.email);
    assert.equal(notify.json?.subject, `New note: A website from ${VISITOR.name}`);
    assert.ok(String(notify.json?.text).includes("Sheet: saved"));
    assert.ok(String(notify.json?.text).includes(VISITOR.message));

    const [reply] = called("reply");
    assert.deepEqual(reply.json?.to, [VISITOR.email]);
    assert.equal(reply.json?.reply_to, SITE_EMAIL);
    assert.equal(reply.json?.subject, "I got your note. Here's what happens next.");
    assert.ok(String(reply.json?.text).startsWith("Hi Ada,\n\nYou reached out!"));

    assert.ok(!("html" in (notify.json ?? {})), "the notification stays plain text");
    for (const email of [...called("notify"), ...called("reply")]) {
      assert.equal((email.init.headers as Record<string, string>).authorization, "Bearer re_test");
    }
  });

  describe("the automatic reply", () => {
    async function reply(overrides: Record<string, unknown> = {}, previewHost = false) {
      calls = [];
      if (previewHost) {
        const host = PREVIEW_HOST;
        responders.siteverify = () => jsonResponse({ success: true, hostname: host, action: "contact" });
        await worker.fetch(post({ ...valid, ...overrides }, { origin: `https://${host}`, url: `https://${host}/api/contact` }), env({ SITE_ENV: "preview" }));
      } else {
        await worker.fetch(post({ ...valid, ...overrides }), env());
      }
      return called("reply")[0].json as Record<string, unknown>;
    }

    test("From, Reply-To and the two auto-responder headers", async () => {
      const r = await reply();
      assert.equal(r.from, `Pat Example <${SITE_EMAIL}>`);
      assert.equal(r.reply_to, SITE_EMAIL);
      assert.deepEqual(r.headers, { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" });
      assert.equal(called("notify")[0].json?.from, `Example Co <${SITE_EMAIL}>`);
      assert.ok(!("headers" in (called("notify")[0].json ?? {})));
    });

    test("multipart: the HTML and the text carry the same words", async () => {
      const r = await reply();
      const text = String(r.text);
      const html = String(r.html);
      const stripped = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&rarr;/g, "→").replace(/&ldquo;|&rdquo;/g, '"').replace(/&rsquo;/g, "'").replace(/&#39;/g, "'").replace(/\s+/g, " ");
      for (const phrase of ["Hi Ada,", "You reached out! That's the first step", "This reply is automatic.", "write back within one business day.", "Talk soon,", "Founder, Example Co", "Please leave out passwords and client details."]) {
        assert.ok(text.includes(phrase), `text has: ${phrase}`);
        assert.ok(stripped.includes(phrase), `html has: ${phrase}`);
      }
      assert.ok(text.includes('Changed your mind? Reply "no thanks" and I won\'t write again.'));
      assert.ok(html.includes("Reply &ldquo;no thanks&rdquo; and I won&rsquo;t write again."));
      assert.ok(html.startsWith("<div"));
      assert.ok(!/<img|<script|<button|pixel|utm_/i.test(html), "no images, scripts, buttons or tracking");
    });

    test("the booking link is the config URL: own line in text, link text in HTML, and in the signature", async () => {
      const r = await reply();
      const lines = String(r.text).split("\n");
      const at = lines.indexOf("If you'd rather talk, pick a time for a free 20-minute call.");
      assert.ok(at >= 0);
      assert.equal(lines[at + 1], BOOKING);
      assert.ok(lines.includes(`Book a free 20-minute call: ${BOOKING}`));
      const html = String(r.html);
      assert.ok(html.includes(`<a href="${BOOKING}" style="color:#112233;">pick a time for a free 20-minute call</a>`));
      assert.ok(html.includes(`<a href="${BOOKING}" style="color:#112233;text-decoration:none;font-weight:bold;">Book a free 20-minute call &rarr;</a>`));
      assert.equal(html.split(BOOKING).length - 1, 2, "no bare URL in the HTML");
      assert.ok(!html.includes("{bookingUrl}") && !String(r.text).includes("{bookingUrl}"));
    });

    test("the booking link is the same in preview and never built from the request origin", async () => {
      const r = await reply({}, true);
      assert.ok(String(r.text).includes(BOOKING));
      assert.ok(String(r.html).includes(BOOKING));
      assert.ok(!String(r.html).includes("workers.dev") && !String(r.text).includes("workers.dev"));
    });

    test("a name that isn't a plain first name gets 'Hi there,' in both versions", async () => {
      for (const name of ["www.example.com/buy now", "J. Smith", "A".repeat(31), "<b>x</b>", "R2D2"]) {
        const r = await reply({ name });
        assert.ok(String(r.text).startsWith("Hi there,\n\n"), `text: ${name}`);
        assert.ok(String(r.html).includes(">Hi there,</p>"), `html: ${name}`);
      }
      const ok = await reply({ name: "  Mary-Anne O'Neil " });
      assert.ok(String(ok.text).startsWith("Hi Mary-Anne,\n\n"));
    });

    test("nothing else the visitor typed appears in the email", async () => {
      const r = await reply({ business: "Acme Plumbing", tools: "QuickBooks", website: "https://acme.example", message: "Secret message body 123" });
      for (const part of [String(r.text), String(r.html), String(r.subject)]) {
        for (const typed of ["Lovelace", VISITOR.email, "Acme Plumbing", "QuickBooks", "acme.example", "Secret message body 123"]) {
          assert.ok(!part.includes(typed), `leaked: ${typed}`);
        }
      }
    });
  });

  test("the partner variant needs no need field", async () => {
    const response = await worker.fetch(post({ ...valid, need: "", topic: "partner" }), env());
    assert.equal(response.status, 200);
    assert.equal(called("notify")[0].json?.subject, `New note: Partner from ${VISITOR.name}`);
  });

  test("a name that isn't a name gets no greeting name", async () => {
    await worker.fetch(post({ ...valid, name: "www.example.com/buy now" }), env());
    assert.ok(String(called("reply")[0].json?.text).startsWith("Hi there,"));
  });

  test("the service-account JWT is RS256 and verifies with the public key", async () => {
    const account = JSON.parse(serviceAccountKey) as { client_email: string; private_key: string };
    const jwt = await signAssertion(account, 1_700_000_000);
    const [header, claims, signature] = jwt.split(".");
    const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
    assert.deepEqual(decode(header), { alg: "RS256", typ: "JWT" });
    assert.deepEqual(decode(claims), {
      iss: "writer@test.iam.gserviceaccount.com",
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", keyPair.publicKey, Buffer.from(signature, "base64url"), new TextEncoder().encode(`${header}.${claims}`));
    assert.ok(ok);
  });
});

describe("preview mode", () => {
  test("mail goes only to the site's address and the row goes to the Preview tab", async () => {
    const response = await worker.fetch(post(valid, { origin: `https://${PREVIEW_HOST}`, url: `https://${PREVIEW_HOST}/api/contact` }), env({ SITE_ENV: "preview" }));
    assert.equal(response.status, 403, "the token's hostname must match the preview host");

    responders.siteverify = () => jsonResponse({ success: true, hostname: PREVIEW_HOST, action: "contact" });
    calls = [];
    const ok = await worker.fetch(post(valid, { origin: `https://${PREVIEW_HOST}`, url: `https://${PREVIEW_HOST}/api/contact` }), env({ SITE_ENV: "preview" }));
    assert.equal(ok.status, 200);
    assert.match(called("sheets")[0].url, /values\/Preview!A%3AK:append/);
    assert.ok(String(called("notify")[0].json?.subject).startsWith("[Preview] New note:"));
    const [reply] = called("reply");
    assert.deepEqual(reply.json?.to, [SITE_EMAIL]);
    assert.equal(reply.json?.subject, `[Preview → would go to ${VISITOR.email}] I got your note. Here's what happens next.`);
  });

  test("a workers.dev branch host counts as a preview even if SITE_ENV says production", () => {
    const mode = (siteEnv: string | undefined, host: string, workerName = "example-site") => resolveMode(siteEnv, host, workerName, ".workers.dev");
    assert.equal(mode("production", PREVIEW_HOST), "preview");
    assert.equal(mode("production", "example-site.acct.workers.dev"), "production");
    assert.equal(mode("production", "example.test"), "production");
    assert.equal(mode("development", "example.test"), null);
    assert.equal(mode("development", "localhost"), "development");
    assert.equal(mode(undefined, "example.test"), null);
  });

  test("the production workers.dev host comes from the Worker name in config, and a placeholder name fails safe", () => {
    assert.equal(resolveMode("production", "other-name.acct.workers.dev", "other-name", ".workers.dev"), "production");
    assert.equal(resolveMode("production", "example-site.acct.workers.dev", "other-name", ".workers.dev"), "preview");
    assert.equal(resolveMode("production", "any.acct.workers.dev", "[[Worker name]]", ".workers.dev"), "preview");
  });
});

describe("development mode", () => {
  test("verifies Turnstile with test keys, then sends nothing", async () => {
    responders.siteverify = () => jsonResponse({ success: true, hostname: "example.com" });
    const response = await worker.fetch(post(valid, { origin: "http://localhost:8787", url: "http://localhost:8787/api/contact" }), env({ SITE_ENV: "development" }));
    assert.equal(response.status, 200);
    assert.deepEqual(calls.map((c) => route(c.url, c.init)), ["siteverify"]);
  });
});

describe("failures", () => {
  test("Sheet fails, email works: success, and the email says to add the row by hand", async () => {
    responders.sheets = () => jsonResponse({ error: "forbidden" }, 403);
    const response = await worker.fetch(post(valid), env());
    assert.equal(response.status, 200);
    assert.equal(called("sheets").length, 1, "a 403 is not retried");
    assert.ok(String(called("notify")[0].json?.text).includes("Sheet: NOT saved - add this one by hand"));
    assert.ok(logs.some((line) => line.includes("sheet_append_failed")));
  });

  test("Sheet works, email fails: still success (the row is real), and it is logged", async () => {
    responders.notify = () => jsonResponse({ name: "internal_server_error" }, 500);
    const response = await worker.fetch(post(valid), env());
    assert.equal(response.status, 200);
    assert.equal(called("notify").length, 2, "a 500 is retried once");
    assert.ok(logs.some((line) => line.includes("notify_failed_sheet_saved")));
  });

  test("both fail: 502 and no auto-reply", async () => {
    responders.sheets = () => jsonResponse({}, 503);
    responders.notify = () => jsonResponse({}, 503);
    const response = await worker.fetch(post(valid), env());
    assert.equal(response.status, 502);
    assert.equal((await bodyOf(response)).error, "failed");
    assert.equal(called("reply").length, 0);
  });

  test("missing secrets fail cleanly with 502, never a success", async () => {
    const response = await worker.fetch(post(valid), env({ RESEND_API_KEY: undefined, GOOGLE_SERVICE_ACCOUNT_KEY: undefined }));
    assert.equal(response.status, 502);
  });

  test("auto-reply fails: success with autoReply false", async () => {
    responders.reply = () => jsonResponse({ name: "validation_error" }, 422);
    const response = await worker.fetch(post(valid), env());
    assert.deepEqual(await bodyOf(response), { ok: true, autoReply: false });
  });

  test("retries reuse the idempotency key", async () => {
    let first = true;
    responders.notify = () => {
      const response = first ? jsonResponse({}, 429) : jsonResponse({ id: "ok" });
      first = false;
      return response;
    };
    await worker.fetch(post(valid), env());
    const keys = called("notify").map((c) => (c.init.headers as Record<string, string>)["idempotency-key"]);
    assert.equal(keys.length, 2);
    assert.equal(keys[0], keys[1]);
  });
});

describe("shared helpers", () => {
  test("firstName", () => {
    assert.equal(firstName("  Pat Example "), "Pat");
    assert.equal(firstName("Zoë"), "Zoë");
    assert.equal(firstName("O'Neil-Smith"), "O'Neil-Smith");
    assert.equal(firstName("J. Smith"), "J.");
    assert.equal(firstName("spam.com"), "");
    assert.equal(firstName("http://x"), "");
    assert.equal(firstName("R2D2"), "");
    assert.equal(firstName(""), "");
  });

  test("safeCell", () => {
    assert.equal(safeCell("=1+1"), "'=1+1");
    assert.equal(safeCell("+1 555"), "'+1 555");
    assert.equal(safeCell("@here"), "'@here");
    assert.equal(safeCell("plain"), "plain");
  });

  test("validateContact cleans text the way the form expects", () => {
    const result = validateContact({ need: "both", name: " Ada\nLovelace ", email: " ada@example.org ", message: "Line one\r\nLine two\u0007" });
    assert.ok(result.ok);
    if (result.ok) {
      assert.equal(result.value.name, "Ada Lovelace");
      assert.equal(result.value.email, "ada@example.org");
      assert.equal(result.value.message, "Line one\nLine two");
    }
  });
});

describe("client values come from the config", () => {
  test("the notification and the signature use the business, owner, email, domain and colors in config", async () => {
    await worker.fetch(post(valid), env());
    assert.ok(String(called("notify")[0].json?.text).includes("Heard about Example Co: Google"));
    const html = String(called("reply")[0].json?.html);
    const text = String(called("reply")[0].json?.text);
    for (const part of ["Pat Example", "Founder, Example Co", "Plain words for plain work", `href="mailto:${SITE_EMAIL}"`, `href="https://example.test"`, ">example.test</a>", "border-left:3px solid #112233", "color:#223344", "color:#334455", "color:#445566", "color:#556677"]) {
      assert.ok(html.includes(part), `html has: ${part}`);
    }
    assert.ok(text.includes(`${SITE_EMAIL} | example.test`));
    assert.ok(text.includes("Founder, Example Co\nPlain words for plain work"));
    const fixtureColors = new Set(["#112233", "#223344", "#334455", "#445566", "#556677"]);
    const used = html.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    assert.ok(used.length > 0 && used.every((color) => fixtureColors.has(color)), `only config colors appear: ${used.join(", ")}`);
  });

  test("another config gives another sender, sheet tab and reply", async () => {
    const other = makeWorker({ siteEmail: "team@another.test", fromName: "Another Co", replyFromName: "Sam Other", schedulerUrl: "https://another.test/call", sheetTabs: { production: "Live", preview: "Draft" } });
    await other.fetch(post(valid), env());
    assert.match(called("sheets")[0].url, /values\/Live!A%3AK:append/);
    assert.equal(called("notify")[0].json?.from, "Another Co <team@another.test>");
    assert.deepEqual(called("notify")[0].json?.to, ["team@another.test"]);
    assert.equal(called("reply")[0].json?.from, "Sam Other <team@another.test>");
    const replyLines = String(called("reply")[0].json?.text).split("\n");
    assert.ok(replyLines.some((line) => line === "https://another.test/call"), "the booking link is on its own line");
    assert.ok(replyLines.some((line) => line === "Book a free 20-minute call: https://another.test/call"));
  });

  for (const [label, contact] of [
    ["no site email", { siteEmail: null }],
    ["no booking link", { schedulerUrl: null }],
  ] as const) {
    test(`fails closed with ${label}: 502, a fixed log event, no Sheet row and no mail`, async () => {
      const response = await makeWorker(contact).fetch(post(valid), env());
      assert.equal(response.status, 502);
      assert.equal((await bodyOf(response)).error, "failed");
      assert.deepEqual(calls.map((c) => route(c.url, c.init)), ["siteverify"]);
      assert.ok(logs.some((l) => l.includes('"event":"config_incomplete"')));
    });
  }

  test("a config full of placeholders and nulls builds the reply without throwing", () => {
    const reply = buildAutoReply({
      business: { name: "[[Business name]]", tagline: "[[Tagline]]" },
      owner: { name: "[[Owner name]]", role: "[[Owner role]]" },
      domain: { url: "https://example.com" },
      contact: { siteEmail: null },
      theme: { colors: { green: "#1e4fa3", ink: "#1c1917", ink2: "#44403c", rust: "#9a3412", line: "#d6d3d1" } },
    });
    assert.ok(reply.signatureHtml.includes("[[Owner name]]") && !reply.signatureHtml.includes("mailto:"));
    assert.deepEqual(reply.signatureText.slice(0, 4), ["[[Owner name]]", "[[Owner role]], [[Business name]]", "[[Tagline]]", "example.com"]);
  });

  test("config text is escaped in the HTML signature", () => {
    const reply = buildAutoReply({ ...FIXTURE, business: { name: "A & B <Co>", tagline: '"x"' } });
    assert.ok(reply.signatureHtml.includes("Founder, A &amp; B &lt;Co&gt;"));
    assert.ok(!reply.signatureHtml.includes("<Co>"));
  });
});

describe("the Apps Script sheet writer", () => {
  const rowCall = (): Call => called("webhook")[0];

  test("posts { secret, tab, row } as JSON, once, and the note is saved", async () => {
    const response = await appsWorker.fetch(post({ ...valid, business: '=HYPERLINK("x")' }), env());
    assert.equal(response.status, 200);
    assert.equal(called("webhook").length, 1);
    assert.equal(called("sheets").length + called("token").length, 0, "no Google API call");
    const call = rowCall();
    assert.equal(call.url, WEBHOOK_URL);
    assert.equal(call.init.method, "POST");
    assert.equal((call.init.headers as Record<string, string>)["content-type"], "application/json");
    assert.ok(call.init.signal instanceof AbortSignal, "has a timeout signal");
    assert.deepEqual(Object.keys(call.json ?? {}).sort(), ["row", "secret", "tab"]);
    assert.equal(call.json?.secret, WEBHOOK_SECRET);
    assert.equal(call.json?.tab, "Submissions");
    const row = call.json?.row as string[];
    assert.equal(row.length, 11);
    assert.deepEqual(row.slice(1, 6), ["A website", "", VISITOR.name, VISITOR.email, "'=HYPERLINK(\"x\")"]);
    assert.equal(row[10], "production");
    assert.ok(String(called("notify")[0].json?.text).includes("Sheet: saved"));
  });

  test("preview rows go to the Preview tab", async () => {
    responders.siteverify = () => jsonResponse({ success: true, hostname: PREVIEW_HOST, action: "contact" });
    const response = await appsWorker.fetch(post(valid, { origin: `https://${PREVIEW_HOST}`, url: `https://${PREVIEW_HOST}/api/contact` }), env({ SITE_ENV: "preview" }));
    assert.equal(response.status, 200);
    assert.equal(rowCall().json?.tab, "Preview");
    assert.equal((rowCall().json?.row as string[])[10], "preview");
  });

  test("the formula guard covers every cell", async () => {
    const saved = await appendRowViaAppsScript(WEBHOOK_URL, WEBHOOK_SECRET, "Submissions", ["=a", "+b", "-c", "@d", "\te", "\rf", "plain", ""]);
    assert.ok(saved);
    assert.deepEqual(rowCall().json?.row, ["'=a", "'+b", "'-c", "'@d", "'\te", "'\rf", "plain", ""]);
  });

  test("a missing, empty or non-Apps-Script URL or secret fails closed without any request", async () => {
    for (const [url, secret] of [
      [undefined, WEBHOOK_SECRET],
      [WEBHOOK_URL, undefined],
      ["", WEBHOOK_SECRET],
      [WEBHOOK_URL, ""],
      ["http://script.google.com/macros/s/x/exec", WEBHOOK_SECRET],
      ["https://evil.example/macros/s/x/exec", WEBHOOK_SECRET],
      ["not a url", WEBHOOK_SECRET],
    ] as const) {
      assert.equal(await appendRowViaAppsScript(url, secret, "Submissions", ["x"]), false);
    }
    assert.equal(calls.length, 0);
    assert.equal(logs.filter((l) => l.includes('"event":"sheet_config_missing"')).length, 7);
  });

  test("with the secrets unset the note still reaches the owner by email, marked as not saved", async () => {
    const response = await appsWorker.fetch(post(valid), env({ SHEET_WEBHOOK_URL: undefined, SHEET_WEBHOOK_SECRET: undefined }));
    assert.equal(response.status, 200);
    assert.equal(called("webhook").length, 0);
    assert.ok(String(called("notify")[0].json?.text).includes("Sheet: NOT saved - add this one by hand"));
  });

  test("HTTP 403/404 fail without a retry", async () => {
    for (const status of [403, 404]) {
      calls = [];
      responders.webhook = () => jsonResponse({ ok: true }, status);
      assert.equal(await appendRowViaAppsScript(WEBHOOK_URL, WEBHOOK_SECRET, "Submissions", ["x"]), false);
      assert.equal(called("webhook").length, 1);
    }
    assert.ok(logs.some((l) => l.includes('"event":"sheet_append_failed"') && l.includes('"status":403')));
  });

  test("ok:false, a non-JSON 200 and a missing ok all fail without a retry", async () => {
    for (const make of [() => jsonResponse({ ok: false }), () => new Response("<html>Sign in</html>", { status: 200 }), () => jsonResponse({}), () => jsonResponse({ ok: "true" })]) {
      calls = [];
      responders.webhook = make;
      assert.equal(await appendRowViaAppsScript(WEBHOOK_URL, WEBHOOK_SECRET, "Submissions", ["x"]), false);
      assert.equal(called("webhook").length, 1);
    }
    assert.ok(logs.some((l) => l.includes('"event":"sheet_append_rejected"')));
  });

  test("a 500 is retried once: one more try can save the row, two failures cannot", async () => {
    let first = true;
    responders.webhook = () => {
      const response = first ? jsonResponse({}, 500) : jsonResponse({ ok: true });
      first = false;
      return response;
    };
    assert.equal(await appendRowViaAppsScript(WEBHOOK_URL, WEBHOOK_SECRET, "Submissions", ["x"]), true);
    assert.equal(called("webhook").length, 2);

    calls = [];
    responders.webhook = () => jsonResponse({}, 503);
    assert.equal(await appendRowViaAppsScript(WEBHOOK_URL, WEBHOOK_SECRET, "Submissions", ["x"]), false);
    assert.equal(called("webhook").length, 2, "never more than one retry");
  });

  test("an unreachable web app is retried once, then the note goes by email only", async () => {
    responders.webhook = () => {
      throw new Error("network down");
    };
    const response = await appsWorker.fetch(post(valid), env());
    assert.equal(response.status, 200);
    assert.equal(called("webhook").length, 2);
    assert.ok(logs.some((l) => l.includes('"event":"sheet_unreachable"')));
    assert.ok(String(called("notify")[0].json?.text).includes("Sheet: NOT saved"));
  });

  test("both writer and email failing is a 502", async () => {
    responders.webhook = () => jsonResponse({ ok: false });
    responders.notify = () => jsonResponse({}, 503);
    const response = await appsWorker.fetch(post(valid), env());
    assert.equal(response.status, 502);
    assert.equal(called("reply").length, 0);
  });

  test("logs hold fixed event names and status codes only: never the URL, the secret or row data", async () => {
    responders.webhook = () => jsonResponse({}, 500);
    await appsWorker.fetch(post({ ...valid, business: "Acme Plumbing" }), env());
    responders.webhook = () => jsonResponse({ ok: false });
    await appsWorker.fetch(post(valid), env());
    responders.webhook = () => {
      throw new Error(`failed for ${WEBHOOK_URL} with ${WEBHOOK_SECRET}`);
    };
    await appsWorker.fetch(post(valid), env());
    const sheetLogs = logs.filter((l) => l.includes('"event":"sheet_'));
    assert.ok(sheetLogs.length >= 4);
    for (const line of sheetLogs) {
      assert.match(line, /^\{"event":"sheet_(append_failed|append_rejected|unreachable|config_missing)"(,"(status|attempt)":\d+)*\}$/);
    }
    for (const line of logs) {
      for (const secret of [WEBHOOK_URL, WEBHOOK_SECRET, "EXAMPLE_DEPLOYMENT_ID", "Acme Plumbing", "network down"]) assert.ok(!line.includes(secret), `leaked ${secret}: ${line}`);
    }
  });

  test("the writer follows contact.sheetWriter in config", async () => {
    await appsWorker.fetch(post(valid), env());
    assert.equal(called("webhook").length, 1);
    assert.equal(called("sheets").length + called("token").length, 0);

    calls = [];
    await makeWorker({ sheetWriter: "service-account" }).fetch(post(valid), env());
    assert.equal(called("webhook").length, 0, "the service-account writer never calls the web app");
    assert.equal(called("sheets").length, 1);
  });

  test("the service-account writer needs its own secrets, not the web-app ones", async () => {
    const response = await worker.fetch(post(valid), env({ GOOGLE_SERVICE_ACCOUNT_KEY: undefined, GOOGLE_SHEET_ID: undefined }));
    assert.equal(response.status, 200);
    assert.equal(called("webhook").length + called("sheets").length, 0);
    assert.ok(String(called("notify")[0].json?.text).includes("Sheet: NOT saved"));
  });
});
