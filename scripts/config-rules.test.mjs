// Tests for scripts/config-rules.mjs: the checks `npm run check:config` makes on site.config.ts, and which Worker
// secret names each form destination needs. Fixture configs only; nothing reads the real site.config.ts.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { configProblems, secretsFor, wranglerText, EDITOR_PATHS } from "./config-rules.mjs";

/** A configured site: a real Worker name, its own ids, the default Sheet destination. */
function config(contact = {}, domain = {}) {
  return {
    domain: { workerName: "example-site", ...domain },
    contact: {
      destination: "sheet",
      pipelineUrl: null,
      sheetWriter: "apps-script",
      rateLimitIds: { production: "2001", preview: "2002" },
      rateLimit: { limit: 5, periodSeconds: 60 },
      ...contact,
    },
  };
}

describe("secretsFor", () => {
  test("pipeline needs RESEND_API_KEY, TURNSTILE_SECRET_KEY and INTAKE_SECRET only", () => {
    assert.deepEqual(secretsFor({ destination: "pipeline", sheetWriter: "apps-script" }), ["RESEND_API_KEY", "TURNSTILE_SECRET_KEY", "INTAKE_SECRET"]);
  });

  test("sheet with the Apps Script writer needs the two webhook secrets", () => {
    assert.deepEqual(secretsFor({ destination: "sheet", sheetWriter: "apps-script" }), ["RESEND_API_KEY", "TURNSTILE_SECRET_KEY", "SHEET_WEBHOOK_URL", "SHEET_WEBHOOK_SECRET"]);
  });

  test("sheet with the service-account writer needs the two Google secrets", () => {
    assert.deepEqual(secretsFor({ destination: "sheet", sheetWriter: "service-account" }), ["RESEND_API_KEY", "TURNSTILE_SECRET_KEY", "GOOGLE_SERVICE_ACCOUNT_KEY", "GOOGLE_SHEET_ID"]);
  });

  test("a missing destination counts as sheet", () => {
    assert.ok(secretsFor({ sheetWriter: "apps-script" }).includes("SHEET_WEBHOOK_URL"));
  });

  test("an unknown destination or writer throws instead of guessing", () => {
    assert.throws(() => secretsFor({ destination: "airtable", sheetWriter: "apps-script" }), /destination/);
    assert.throws(() => secretsFor({ destination: "sheet", sheetWriter: "csv" }), /sheetWriter/);
  });
});

describe("configProblems: destination", () => {
  test("a valid sheet config has no problems", () => {
    assert.deepEqual(configProblems(config()), []);
  });

  test("a valid pipeline config has no problems", () => {
    assert.deepEqual(configProblems(config({ destination: "pipeline", pipelineUrl: "https://pipeline.example.test" })), []);
  });

  test("an unknown destination is a problem", () => {
    const problems = configProblems(config({ destination: "airtable" }));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /contact\.destination must be "sheet" or "pipeline"/);
  });

  test("pipeline without a URL, with http, with a path or with a placeholder is a problem", () => {
    for (const pipelineUrl of [null, "", "http://pipeline.example.test", "https://pipeline.example.test/intake", "https://pipeline.example.test/", "[[Pipeline URL]]", "not a url"]) {
      const problems = configProblems(config({ destination: "pipeline", pipelineUrl }));
      assert.equal(problems.length, 1, `expected one problem for ${JSON.stringify(pipelineUrl)}`);
      assert.match(problems[0], /contact\.pipelineUrl/);
    }
  });

  test("a URL with credentials or a query is not a plain https origin", () => {
    for (const pipelineUrl of ["https://user:pw@pipeline.example.test", "https://pipeline.example.test?x=1"]) {
      assert.equal(configProblems(config({ destination: "pipeline", pipelineUrl })).length, 1, pipelineUrl);
    }
  });

  test("pipelineUrl is not required for the sheet destination", () => {
    assert.deepEqual(configProblems(config({ destination: "sheet", pipelineUrl: null })), []);
  });
});

describe("configProblems: rate-limit ids", () => {
  test("missing ids are a problem", () => {
    assert.ok(configProblems(config({ rateLimitIds: undefined })).some((p) => /contact\.rateLimitIds/.test(p)));
    assert.ok(configProblems(config({ rateLimitIds: { production: "2001" } })).some((p) => /rateLimitIds\.preview/.test(p)));
  });

  test("ids that are not whole numbers are a problem", () => {
    for (const bad of ["", "abc", "20.5", "-1", "[[Rate limit namespace id (production)]]", 2001]) {
      const problems = configProblems(config({ rateLimitIds: { production: bad, preview: "2002" } }));
      assert.ok(problems.some((p) => /rateLimitIds\.production/.test(p)), `expected a problem for ${JSON.stringify(bad)}`);
    }
  });

  test("the same id for production and preview is a problem", () => {
    assert.ok(configProblems(config({ rateLimitIds: { production: "2001", preview: "2001" } })).some((p) => /different/.test(p)));
  });

  test("a configured site may not reuse the template's 1001 or 1002", () => {
    for (const ids of [{ production: "1001", preview: "2002" }, { production: "2001", preview: "1002" }, { production: "1001", preview: "1002" }]) {
      assert.ok(configProblems(config({ rateLimitIds: ids })).some((p) => /1001|1002/.test(p)), JSON.stringify(ids));
    }
  });

  test("the template itself (a [[placeholder]] Worker name) may keep 1001 and 1002", () => {
    const template = config({ rateLimitIds: { production: "1001", preview: "1002" } }, { workerName: "[[Worker name]]" });
    assert.deepEqual(configProblems(template), []);
  });

  test("the template with a malformed id still fails", () => {
    const template = config({ rateLimitIds: { production: "x", preview: "1002" } }, { workerName: "[[Worker name]]" });
    assert.ok(configProblems(template).length > 0);
  });
});

/** A configured site with the editor on and every value set. */
function withEditor(editor = {}, contact = {}, domain = {}) {
  return {
    ...config(contact, domain),
    editor: {
      enabled: true,
      ownerEmails: ["owner@example.test"],
      access: { teamDomain: "example-team", aud: "abc123" },
      github: { owner: "example-org", repo: "example-site", appId: "12345", installationId: "67890", botLogin: "example-bot[bot]" },
      workersSubdomain: "example-sub",
      dailyChangeLimit: 10,
      rateLimitId: "2003",
      kv: { oauth: "a".repeat(32), editor: "b".repeat(32) },
      ignoredChecks: ["change-report"],
      ...editor,
    },
  };
}

describe("wranglerText: editor bindings", () => {
  test("a disabled or missing editor adds no editor bindings", () => {
    for (const c of [config(), { ...config(), editor: { enabled: false } }]) {
      const text = wranglerText(c);
      assert.match(text, /"main": "\.\/worker\/index\.ts"/);
      assert.match(text, /"binding": "ASSETS"/);
      assert.match(text, /"run_worker_first": \["\/api\/\*"\]/);
      assert.doesNotMatch(text, /OAUTH_KV|EDITOR_KV|EDITOR_RATE_LIMIT|GITHUB_APP_PRIVATE_KEY|\/mcp|\/owner/);
    }
  });

  test("an enabled editor adds its paths, both KV namespaces, the rate limit and the secret", () => {
    const text = wranglerText(withEditor());
    for (const path of EDITOR_PATHS) assert.ok(text.includes(`"${path}"`), path);
    assert.match(text, /"binding": "OAUTH_KV", "id": "a{32}"/);
    assert.match(text, /"binding": "EDITOR_KV", "id": "b{32}"/);
    assert.match(text, /"name": "EDITOR_RATE_LIMIT", "namespace_id": "2003", "simple": \{ "limit": 30, "period": 60 \}/);
    assert.match(text, /"GITHUB_APP_PRIVATE_KEY"/);
  });

  test("previews get none of the editor bindings", () => {
    const text = wranglerText(withEditor());
    const previews = text.slice(text.indexOf('"previews"'));
    assert.doesNotMatch(previews, /OAUTH_KV|EDITOR_KV|EDITOR_RATE_LIMIT|GITHUB_APP_PRIVATE_KEY|\/mcp/);
    assert.match(previews, /CONTACT_RATE_LIMIT/);
  });

  test("the generated text with the editor on is valid JSON once comments are removed", () => {
    const text = wranglerText(withEditor());
    const parsed = JSON.parse(text.replace(/^\s*\/\/.*$/gm, ""));
    assert.equal(parsed.assets.run_worker_first.length, 1 + EDITOR_PATHS.length);
    assert.equal(parsed.kv_namespaces.length, 2);
    assert.equal(parsed.ratelimits.length, 2);
  });
});

describe("configProblems: editor", () => {
  test("a disabled editor is not checked", () => {
    assert.deepEqual(configProblems({ ...config(), editor: { enabled: false, ownerEmails: [] } }), []);
  });

  test("a fully set editor has no problems", () => {
    assert.deepEqual(configProblems(withEditor()), []);
  });

  test("each missing value fails with a plain message naming it", () => {
    const cases = [
      [{ ownerEmails: [] }, /editor\.ownerEmails needs at least one owner email/],
      [{ ownerEmails: ["not-an-email"] }, /editor\.ownerEmails has a value that is not an email/],
      [{ access: { teamDomain: null, aud: "x" } }, /editor\.access\.teamDomain/],
      [{ access: { teamDomain: "Team.cloudflareaccess.com", aud: "x" } }, /editor\.access\.teamDomain/],
      [{ access: { teamDomain: "team", aud: null } }, /editor\.access\.aud/],
      [{ github: { owner: null, repo: "r", appId: "1", installationId: "2", botLogin: "b" } }, /editor\.github\.owner/],
      [{ github: { owner: "o", repo: null, appId: "1", installationId: "2", botLogin: "b" } }, /editor\.github\.repo/],
      [{ github: { owner: "o", repo: "r", appId: "abc", installationId: "2", botLogin: "b" } }, /editor\.github\.appId/],
      [{ github: { owner: "o", repo: "r", appId: "1", installationId: null, botLogin: "b" } }, /editor\.github\.installationId/],
      [{ github: { owner: "o", repo: "r", appId: "1", installationId: "2", botLogin: null } }, /editor\.github\.botLogin/],
      [{ workersSubdomain: null }, /editor\.workersSubdomain/],
      [{ kv: { oauth: null, editor: "b".repeat(32) } }, /editor\.kv\.oauth/],
      [{ kv: { oauth: "a".repeat(32), editor: "short" } }, /editor\.kv\.editor/],
      [{ dailyChangeLimit: 0 }, /editor\.dailyChangeLimit/],
      [{ rateLimitId: 2003 }, /editor\.rateLimitId must be a whole number/],
    ];
    for (const [override, pattern] of cases) {
      const problems = configProblems(withEditor(override));
      assert.equal(problems.length, 1, `${JSON.stringify(override)} gave ${JSON.stringify(problems)}`);
      assert.match(problems[0], pattern);
    }
  });

  test("the editor rate-limit id may not equal a contact id", () => {
    for (const rateLimitId of ["2001", "2002"]) {
      assert.ok(configProblems(withEditor({ rateLimitId })).some((p) => /same as a contact form id/.test(p)), rateLimitId);
    }
  });

  test("a configured site may not use the template's 1003, the template itself may", () => {
    assert.ok(configProblems(withEditor({ rateLimitId: "1003" })).some((p) => /template's own id/.test(p)));
    const template = withEditor({ rateLimitId: "1003" }, { rateLimitIds: { production: "1001", preview: "1002" } }, { workerName: "[[Worker name]]" });
    assert.deepEqual(configProblems(template), []);
  });
});
