// The contact form as the first form: this site's six fields are described in src/content/forms/contact.json (docs/SITE-DIFFERENCES.md D14).
// The contact form itself is still judged by src/lib/contact-validation.ts and written by src/components/hl/ContactForm.tsx; the file lets
// the content check, the form registry and the editor know the form exists, and a test keeps it equal to src/content/contact-fields.ts.
// Import-free apart from sibling shared modules and the JSON file.
import contactFile from "../content/forms/contact.json" with { type: "json" };
import type { FormDefinition } from "./schema.ts";
import { formFromFile } from "./submission.ts";

/** The contact form keeps its own, smaller body limit (R13): a 17,000-character message is refused with 413. */
export const CONTACT_BODY_BYTES = 16384;

let parsed: FormDefinition | null = null;

/** The contact form's definition, read from contact.json. A fresh copy each call. */
export function contactDefinition(): FormDefinition {
  // contact.json is judged by the content check (formProblems) at build time; the browser does not repeat it.
  parsed ??= formFromFile(contactFile as unknown as Record<string, unknown>);
  return { ...parsed, fields: parsed.fields.map((field) => ({ ...field, ...(field.options ? { options: [...field.options] } : {}) })) };
}
