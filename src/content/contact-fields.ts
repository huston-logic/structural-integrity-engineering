/**
 * The contact form's six fields (copy deck, Contact: "Form fields (same as today, all required): First name, Last name,
 * Email, Phone, Project city and state, Project scope. Button: Send request."). The browser form and the Worker
 * (worker/contact.ts) both read this module, so their labels, order and limits always match. It imports nothing,
 * because the Worker bundles it too.
 */
export type ContactKey = "firstName" | "lastName" | "email" | "phone" | "location" | "scope";

export type ContactFieldSpec = {
  key: ContactKey;
  /** Verbatim from the copy deck. Also the label in the form, the notification email and the Sheet header. */
  label: string;
  /** "textarea" is the only multi-line field. */
  kind: "text" | "email" | "tel" | "textarea";
  autoComplete: string;
  /** Maximum length in characters. The form sets it as `maxLength`, so only a crafted request hits it. */
  maxLength: number;
  /** Every field is required (copy deck). */
  required: true;
};

export const contactFields: readonly ContactFieldSpec[] = [
  { key: "firstName", label: "First name", kind: "text", autoComplete: "given-name", maxLength: 100, required: true },
  { key: "lastName", label: "Last name", kind: "text", autoComplete: "family-name", maxLength: 100, required: true },
  { key: "email", label: "Email", kind: "email", autoComplete: "email", maxLength: 254, required: true },
  { key: "phone", label: "Phone", kind: "tel", autoComplete: "tel", maxLength: 40, required: true },
  { key: "location", label: "Project city and state", kind: "text", autoComplete: "off", maxLength: 200, required: true },
  { key: "scope", label: "Project scope", kind: "textarea", autoComplete: "off", maxLength: 5000, required: true },
];

export const contactKeys: readonly ContactKey[] = contactFields.map((field) => field.key);

export function fieldLabel(key: ContactKey): string {
  return contactFields.find((field) => field.key === key)?.label ?? key;
}

/**
 * The Google Sheet header row (row 1 of each tab), in the order the Worker writes a row (worker/messages.ts, sheetRow).
 * docs/apps-script/contact-sheet.gs and the README list the same headers; a Worker test checks they agree.
 */
export const sheetHeaders: readonly string[] = ["Received (UTC)", ...contactFields.map((field) => field.label), "Mode"];

/** The hidden spam-trap field. People never see it; bots that fill every field do. */
export const honeypot = { name: "company_fax", label: "Leave this empty" } as const;

/**
 * The copy deck's "After sending" line: "Thanks. Your request is in, and Dylan will reply within 48 hours." It is the
 * thanks page text and the whole body of the automatic reply. `subject` is the middle of that sentence, so no new words.
 */
export const confirmation = {
  heading: "Thanks.",
  body: "Your request is in, and Dylan will reply within 48 hours.",
  subject: "Your request is in",
} as const;
