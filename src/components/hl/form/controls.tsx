import Link from "next/link";
import type { ReactNode } from "react";
import { CONTACT_PATH } from "@/blocks/schema";
import { Text } from "@/components/ui/Text";
import { honeypot } from "@/content/contact-fields";
import { formWords } from "@/content/forms";
import type { FormField } from "@/forms/schema";

/**
 * The form primitives of the `form` block: labels, controls, the error line, the chip row, the button and the no-JavaScript note.
 * On this site they are drawn on a dark panel with the Dusk colors, as the contact form is, because the template's light panel
 * would put mist and error text on snow (1.4:1 and 1.5:1). docs/SITE-DIFFERENCES.md, D14.
 */

export type FieldIds = { input: string; help: string; error: string };
export type Choice = { value: string; label: string };

export const labelClass = "block font-ui text-label font-semibold text-snow";
const controlClass =
  "mt-2 block w-full rounded-field border border-mist bg-night px-3.5 text-control text-snow scheme-dark placeholder:text-mist focus:border-amber aria-[invalid=true]:border-error";
export const inputClass = `${controlClass} h-13`;

/** The message for a problem with a field: its own, else the default for its type. */
export function errorFor(field: FormField): string {
  return field.error ?? formWords.errors[field.type];
}

/** A label with "(optional)" on a field that is not required. A checkbox or consent label is a sentence, and a box left unticked is optional by nature, so it never gets the mark. */
export function labelFor(field: FormField, marked: boolean): string {
  const isBox = field.type === "checkbox" || field.type === "consent";
  return marked && !field.required && !isBox ? `${field.label} ${formWords.optional}` : field.label;
}

/** Fields whose problems a person can fix show a live error line; the others never need one. */
export function canFail(field: FormField): boolean {
  return field.required || field.type === "email" || field.type === "phone";
}

export function ErrorLine({ id, message }: { id: string; message?: string }) {
  return (
    <div id={id} aria-live="polite">
      {message ? (
        <p className="mt-2 flex items-start gap-2 text-label text-error">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.75 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="8" cy="8" r="6.25" />
          </svg>
          {message}
        </p>
      ) : null}
    </div>
  );
}

function Labeled({ id, text, children }: { id: string; text: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {text}
      </label>
      {children}
    </div>
  );
}

function Help({ id, text, rich }: { id: string; text: string; rich: boolean }) {
  return (
    <p id={id} className="mt-2 text-small text-mist">
      {rich ? <Text>{text}</Text> : text}
    </p>
  );
}

function ChipRow({
  field,
  legend,
  options,
  selected,
  onSelect,
  error,
  describedBy,
  children,
}: {
  field: FormField;
  legend: string;
  options: readonly Choice[];
  selected: string;
  onSelect: (value: string) => void;
  error?: string;
  describedBy?: string;
  children: ReactNode;
}) {
  return (
    <fieldset role="radiogroup" aria-required={field.required ? "true" : undefined} aria-invalid={error ? "true" : undefined} aria-describedby={describedBy}>
      <legend className={labelClass}>{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={field.id}
              value={option.value}
              checked={selected === option.value}
              onChange={() => onSelect(option.value)}
              className="peer sr-only"
            />
            <span
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-4.5 font-ui text-chip font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-amber ${
                selected === option.value ? "border-amber bg-amber text-night" : error ? "border-error text-snow" : "border-mist text-snow"
              }`}
            >
              {selected === option.value ? <span aria-hidden="true" className="size-2 rounded-pill bg-night" /> : null}
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}

export type FieldViewProps = {
  field: FormField;
  ids: FieldIds;
  /** The label as shown (with "(optional)" already applied where wanted). */
  label: string;
  error?: string;
  /** Help text may carry **bold** and [[placeholder]]; the contact form shows its note as plain text. */
  rich: boolean;
  placeholder?: string;
  /** A long-text field drawn as one line (the contact form's `tools`). */
  oneLine?: boolean;
  /** The first, empty choice of a menu. */
  emptyChoice: string;
  /** Choices and state of a `buttons` dropdown. */
  chips?: { options: readonly Choice[]; selected: string; onSelect: (value: string) => void };
};

/** One field of a form: its label, control, help and error line, from the field's own settings. */
export function FieldView({ field, ids, label, error, rich, placeholder, oneLine, emptyChoice, chips }: FieldViewProps) {
  const hasLine = canFail(field);
  const described = [field.help ? ids.help : undefined, hasLine && error ? ids.error : undefined].filter(Boolean).join(" ") || undefined;
  const invalid = error ? ("true" as const) : undefined;
  const required = field.required ? ({ required: true, "aria-required": "true" } as const) : {};
  const help = field.help ? <Help id={ids.help} text={field.help} rich={rich} /> : null;
  const line = hasLine ? <ErrorLine id={ids.error} message={error} /> : null;

  if (field.type === "dropdown" && field.display === "buttons" && chips) {
    return (
      <ChipRow field={field} legend={label} options={chips.options} selected={chips.selected} onSelect={chips.onSelect} error={error} describedBy={described}>
        {help}
        {line}
      </ChipRow>
    );
  }

  if (field.type === "checkbox" || field.type === "consent") {
    return (
      <div>
        <label htmlFor={ids.input} className="flex min-h-11 cursor-pointer items-start gap-3 text-control text-snow">
          <input id={ids.input} name={field.id} type="checkbox" {...required} aria-invalid={invalid} aria-describedby={described} className="mt-1 size-5 shrink-0 accent-amber scheme-dark" />
          <span>{label}</span>
        </label>
        {help}
        {line}
      </div>
    );
  }

  let control: ReactNode;
  if (field.type === "dropdown") {
    control = (
      <select id={ids.input} name={field.id} defaultValue="" {...required} aria-invalid={invalid} aria-describedby={described} className={inputClass}>
        <option value="">{emptyChoice}</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "long-text" && !oneLine) {
    control = (
      <textarea
        id={ids.input}
        name={field.id}
        rows={5}
        {...required}
        maxLength={field.max}
        aria-invalid={invalid}
        aria-describedby={described}
        placeholder={placeholder}
        className={`${controlClass} min-h-35 py-3`}
      />
    );
  } else {
    const kind = field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.purpose === "website" ? "url" : "text";
    const autoComplete =
      field.type === "email"
        ? "email"
        : field.type === "phone"
          ? "tel"
          : field.purpose === "name"
            ? "name"
            : field.purpose === "organization"
              ? "organization"
              : field.purpose === "website"
                ? "url"
                : field.purpose === "address"
                  ? "street-address"
                  : undefined;
    control = (
      <input
        id={ids.input}
        name={field.id}
        type={kind}
        autoComplete={autoComplete}
        {...required}
        maxLength={field.max}
        aria-invalid={invalid}
        aria-describedby={described}
        placeholder={placeholder}
        className={inputClass}
      />
    );
  }

  return (
    <Labeled id={ids.input} text={label}>
      {control}
      {help}
      {line}
    </Labeled>
  );
}

/** Spam trap: hidden from people and screen readers, out of the tab order. A filled value is refused. */
export function Honeypot({ id }: { id: string }) {
  return (
    <div aria-hidden="true" className="sr-only">
      <label htmlFor={id}>{honeypot.label}</label>
      <input id={id} name={honeypot.name} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

export function SubmitButton({ label, sending }: { label: string; sending: boolean }) {
  return (
    <button
      type="submit"
      aria-disabled={sending ? "true" : undefined}
      aria-busy={sending ? "true" : undefined}
      className="inline-flex min-h-13.5 w-full items-center justify-center rounded-btn bg-amber px-6 font-ui text-btn font-bold text-night hover:bg-amber-lit aria-disabled:cursor-wait aria-disabled:opacity-70 md:w-auto md:justify-start md:pl-5.5"
    >
      {label}
    </button>
  );
}

/** Under the button, for visitors without JavaScript: the form cannot send, so it says how to reach the owner (R6). */
export function NoScriptNote({ email }: { email: string | null }) {
  const [before, after] = formWords.noScriptNoEmail.split("contact page");
  return (
    <noscript>
      <p className="mt-4 text-small text-mist">
        {email ? (
          <>
            {formWords.noScript} <a href={`mailto:${email}`} className="underline">{email}</a>.
          </>
        ) : after === undefined ? (
          formWords.noScriptNoEmail
        ) : (
          <>
            {before}
            <Link href={CONTACT_PATH} className="underline">
              contact page
            </Link>
            {after}
          </>
        )}
      </p>
    </noscript>
  );
}
