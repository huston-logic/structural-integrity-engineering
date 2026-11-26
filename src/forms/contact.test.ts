import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { confirmation, contactFields } from "../content/contact-fields.ts";
import { formWords } from "../content/forms.ts";
import contactJson from "../content/forms/contact.json" with { type: "json" };
import { validateContact } from "../lib/contact-validation.ts";
import { answerLines, emailOf } from "./answers.ts";
import { CONTACT_BODY_BYTES, contactDefinition } from "./contact.ts";
import { CONTACT_FORM_ID, DEFAULT_FORM_SETTINGS } from "./schema.ts";
import { showcaseForm } from "./showcase.ts";
import { formProblems, parseForm, validateSubmission } from "./validate.ts";

const ctx = { fileExists: () => true };

// contact.json names the six fields of src/content/contact-fields.ts with slug ids (docs/SITE-DIFFERENCES.md D14).
const ID_OF = { firstName: "first-name", lastName: "last-name", email: "email", phone: "phone", location: "location", scope: "scope" } as const;
const TYPE_OF = { text: "short-text", email: "email", tel: "phone", textarea: "long-text" } as const;

describe("contact.json", () => {
  test("is a good form file", () => assert.deepEqual(formProblems(CONTACT_FORM_ID, contactJson, ctx, DEFAULT_FORM_SETTINGS), []));
  test("the browser's light reading equals the checked reading", () => {
    assert.deepEqual(contactDefinition(), parseForm(contactJson, DEFAULT_FORM_SETTINGS, CONTACT_FORM_ID));
  });
  test("has exactly the copy deck's six fields, in order, all required, with the labels, types and limits of contact-fields.ts", () => {
    const fields = contactDefinition().fields;
    assert.deepEqual(fields.map((f) => f.id), contactFields.map((spec) => ID_OF[spec.key]));
    contactFields.forEach((spec, index) => {
      const field = fields[index];
      assert.equal(field?.label, spec.label, spec.key);
      assert.equal(field?.type, TYPE_OF[spec.kind], spec.key);
      assert.equal(field?.required, true, spec.key);
      // Email and phone have limits fixed by their type in a form file; the contact form's own are in contact-fields.ts.
      if (spec.kind === "text" || spec.kind === "textarea") assert.equal(field?.max, spec.maxLength, spec.key);
    });
    assert.equal(fields.find((f) => f.id === "email")?.max, contactFields.find((f) => f.key === "email")?.maxLength);
  });
  test("each field's error words are the contact page's (noteForm.errors), so a drift fails here", () => {
    // contact.ts imports through the "@/" alias, which Node's test runner cannot resolve, so its errors block is read as text.
    const source = readFileSync(new URL("../content/contact.ts", import.meta.url), "utf8");
    const block = /errors: \{([^}]*)\}/.exec(source)?.[1] ?? "";
    const pageError = (key: string) => new RegExp(`${key}: "([^"]*)"`).exec(block)?.[1];
    for (const spec of contactFields) {
      const field = contactDefinition().fields.find((f) => f.id === ID_OF[spec.key]);
      assert.ok(field?.error, spec.key);
      assert.equal(field.error, pageError(spec.key), spec.key);
    }
    // The phone message promises 7 to 15 digits, which is validateContact's rule.
    assert.match(pageError("phone") ?? "", /7 to 15 digits/);
  });
  test("the button and the thank-you line are the copy deck's", () => {
    assert.equal(contactJson.button, "Send request");
    assert.equal(contactJson.thanks, `${confirmation.heading} ${confirmation.body}`);
  });
  test("the body limit stays 16 KB", () => assert.equal(CONTACT_BODY_BYTES, 16384));
});

describe("the contact form's validator and the shared form validator judge the same six fields", () => {
  const valid = { firstName: "Ada", lastName: "Lovelace", email: "ada@example.org", phone: "(907) 350-3456", location: "Anchorage, AK", scope: "A deck on the back of the house." };
  const asAnswers = (input: Record<string, unknown>) => Object.fromEntries(Object.entries(input).map(([key, value]) => [ID_OF[key as keyof typeof ID_OF], value]));
  const failing = (input: Record<string, unknown>): string[] => {
    const result = validateSubmission(contactDefinition(), asAnswers(input));
    return result.ok ? [] : result.fields;
  };
  const sameFailures = (input: Record<string, unknown>) => {
    const own = validateContact(input);
    assert.deepEqual(failing(input), own.ok ? [] : own.fields.map((key) => ID_OF[key]));
  };

  test("a good request passes both", () => {
    assert.ok(validateContact(valid).ok);
    assert.ok(validateSubmission(contactDefinition(), asAnswers(valid)).ok);
  });
  test("each field left empty fails both, in form order", () => {
    sameFailures({});
    for (const key of Object.keys(valid)) sameFailures({ ...valid, [key]: "" });
  });
  test("a bad email or phone fails both", () => {
    sameFailures({ ...valid, email: "nope" });
    sameFailures({ ...valid, phone: "call me" });
    sameFailures({ ...valid, phone: "12345" });
  });
  test("the phone limits differ on purpose: the contact form allows 7 to 15 digits, form files 7 to 20", () => {
    // The contact route (worker/contact.ts) uses validateContact only, never the form-file validator, so the stricter
    // contact rule stands there. A 16-digit phone is refused by it, and the contact page's message says "7 to 15 digits".
    const sixteen = "1234567890123456";
    const own = validateContact({ ...valid, phone: sixteen });
    assert.equal(own.ok, false);
    if (!own.ok) assert.deepEqual(own.fields, ["phone"]);
  });
  test("text is cleaned alike", () => {
    const own = validateContact({ ...valid, firstName: " Ada\n", scope: "Line one\r\nLine two" });
    const shared = validateSubmission(contactDefinition(), asAnswers({ ...valid, firstName: " Ada\n", scope: "Line one\r\nLine two" }));
    assert.ok(own.ok && shared.ok);
    if (own.ok && shared.ok) {
      assert.equal(shared.value["first-name"], own.value.firstName);
      assert.equal(shared.value["scope"], own.value.scope);
    }
  });
});

describe("answers", () => {
  test("the contact answers read as labelled lines, in field order", () => {
    const def = contactDefinition();
    const result = validateSubmission(def, { "first-name": "Ada", "last-name": "Lovelace", email: "a@b.co", phone: "9073503456", location: "Anchorage, AK", scope: "Hi" });
    assert.ok(result.ok);
    if (result.ok) {
      assert.deepEqual(answerLines(def, result.value).map((line) => line.label), contactFields.map((spec) => spec.label));
      assert.equal(emailOf(def, result.value), "a@b.co");
    }
  });
  test("checkboxes read Yes or No", () => {
    const result = validateSubmission(showcaseForm, { name: "Ada", email: "a@b.co", interest: "A website", message: "Hi", copy: true });
    assert.ok(result.ok);
    if (result.ok) {
      const lines = answerLines(showcaseForm, result.value);
      assert.deepEqual(lines.slice(-2), [
        { label: "I have worked with you before.", text: "Yes" },
        { label: "You can email me now and then with news.", text: "No" },
      ]);
    }
  });
});

describe("showcase form and the words", () => {
  test("the showcase form is a good form, with every field type, live and with no download", () => {
    // A parsed definition carries the fixed limits of email and phone; a file may not.
    const file = { ...showcaseForm, fields: showcaseForm.fields.map(({ max, ...field }) => (field.type === "short-text" || field.type === "long-text" ? { ...field, max } : field)) };
    assert.deepEqual(formProblems("showcase-copy", file, ctx, DEFAULT_FORM_SETTINGS), []);
    assert.equal(showcaseForm.status, "live");
    assert.equal(showcaseForm.download, undefined);
    assert.deepEqual([...new Set(showcaseForm.fields.map((f) => f.type))].sort(), ["checkbox", "consent", "dropdown", "email", "long-text", "phone", "short-text"]);
  });
  test("formWords holds plain data, with the {title} marker in the download lines", () => {
    assert.equal(formWords.optional, "(optional)");
    assert.equal(formWords.download.subject, "Your copy of {title}");
    assert.ok(formWords.download.lines.every((line) => typeof line === "string"));
    assert.equal(formWords.errors.consent, "Please tick this box to go on.");
  });
});
