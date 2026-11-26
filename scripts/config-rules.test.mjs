// Tests for scripts/config-rules.mjs: the checks `npm run check:config` makes on site.config.ts, and which Worker
// secret names each form destination needs. Fixture configs only; nothing reads the real site.config.ts.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { configProblems, secretsFor } from "./config-rules.mjs";

/** A configured site: a real Worker name, its own ids, the default Sheet destination. */
function config(contact = {}, domain = {}) {
  return {
    domain: { workerName: "example-site", ...domain },
    contact: {
      destination: "sheet",
      pipelineUrl: null,
      sheetWriter: "apps-script",
      rateLimitIds: { production: "2001", preview: "2002" },
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
