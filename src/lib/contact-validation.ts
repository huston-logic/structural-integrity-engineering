import { contactFields, contactKeys, type ContactKey } from "../content/contact-fields.ts";

/** The fields that can fail validation: all six, because every field is required. */
export type ContactField = ContactKey;

export type ContactSubmission = Record<ContactKey, string>;

export { contactKeys };
export type ContactInput = Partial<Record<ContactKey, unknown>>;

export type ContactValidation =
  | { ok: true; value: ContactSubmission }
  | {
      ok: false;
      /** Fields to show an error for, in form order. */
      fields: ContactField[];
      /** A value no person could enter through the form (wrong type, over the length limit). */
      malformed: boolean;
    };

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Digits, spaces and ( ) + . - only, with 7 to 15 digits (the E.164 range). */
const PHONE_CHARACTERS = /^[\d\s().+-]+$/;

export function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "").length;
  return PHONE_CHARACTERS.test(value) && digits >= 7 && digits <= 15;
}

// C0 and C1 control characters plus DEL. cleanText keeps tab and newline.
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g;
const CONTROL_EXCEPT_TAB_NEWLINE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;

/** One line of text: no control characters or line breaks, single spaces, trimmed. */
export function cleanLine(value: string): string {
  return value.normalize("NFC").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}

/** Multi-line text: line breaks kept (as \n), other control characters removed, trimmed. */
export function cleanText(value: string): string {
  return value.normalize("NFC").replace(/\r\n?/g, "\n").replace(CONTROL_EXCEPT_TAB_NEWLINE, "").trim();
}

/** Validates a contact submission exactly as the form does. Used by the form in the browser and by the Worker. */
export function validateContact(input: ContactInput): ContactValidation {
  let malformed = false;
  const value = {} as ContactSubmission;
  const fields: ContactField[] = [];

  for (const spec of contactFields) {
    const given = input[spec.key];
    let text = "";
    if (typeof given === "string") text = given;
    else if (given !== undefined && given !== null) malformed = true;
    if (text.length > spec.maxLength) malformed = true;
    const clean = spec.kind === "textarea" ? cleanText(text) : cleanLine(text);
    value[spec.key] = clean;

    const valid = spec.key === "email" ? EMAIL_PATTERN.test(clean) : spec.key === "phone" ? isPhone(clean) : clean !== "";
    if (!valid) fields.push(spec.key);
  }

  if (fields.length > 0 || malformed) return { ok: false, fields, malformed };
  return { ok: true, value };
}
