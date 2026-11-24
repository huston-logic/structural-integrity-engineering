"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type SyntheticEvent } from "react";
import { noteForm } from "@/content/contact";
import { contactFields, honeypot, type ContactFieldSpec } from "@/content/contact-fields";
import { providers } from "@/content/providers";
import { siteConfig } from "@/content/site";
import { validateContact, type ContactField, type ContactInput } from "@/lib/contact-validation";
import { buttonClass } from "./Button";
import { turnstileSiteKey, useTurnstile } from "./useTurnstile";

type Errors = Partial<Record<ContactField, string>>;
type SendError = keyof typeof noteForm.sendErrors;

const label = "block text-[15px] font-semibold text-snow";
const control =
  "mt-2 block w-full rounded-field border border-mist bg-night px-[14px] text-[17px] text-snow [color-scheme:dark] placeholder:text-mist focus:border-amber aria-[invalid=true]:border-error";

function ErrorLine({ id, message }: { id: string; message?: string }) {
  return (
    <div id={id} aria-live="polite">
      {message ? (
        <p className="mt-2 flex items-start gap-2 text-[15px] text-error">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-[3px] size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="8" cy="8" r="6.25" />
          </svg>
          {message}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The contact form: the six required fields from the copy deck (`contactFields`). It validates with the same rules as
 * the Worker (`src/lib/contact-validation.ts`), gets a Turnstile token, and posts JSON to `/api/contact`
 * (worker/contact.ts). Only a real success moves on to /contact-us/thanks. Nothing the visitor typed goes in the URL or
 * in browser storage. Every failure keeps the visitor's answers. No `action`, and `method="post"`, so without JavaScript
 * nothing is sent.
 */
export function ContactForm() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<SendError | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const {
    containerRef: turnstileRef,
    start: startTurnstile,
    getToken,
    reset: resetTurnstile,
    isConfigError: turnstileConfigError,
  } = useTurnstile(providers.turnstileSiteKey);

  function showFieldErrors(fields: ContactField[]) {
    const next: Errors = {};
    for (const field of fields) next[field] = noteForm.errors[field];
    setErrors(next);
    const first = contactFields.find((f) => next[f.key]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#cf-${first.key}`)?.focus();
  }

  function fail(error: SendError) {
    resetTurnstile();
    setSending(false);
    setSendError(error);
  }

  async function submit(event: SyntheticEvent) {
    event.preventDefault();
    if (sending || !formRef.current) return;
    const trap = new FormData(formRef.current).get(honeypot.name);
    const answers: ContactInput = { ...values };

    setSendError(null);
    const result = validateContact(answers);
    if (!result.ok) {
      showFieldErrors(result.fields);
      if (result.fields.length === 0) setSendError("notVerified");
      return;
    }
    setErrors({});
    // A missing site key can't verify anything, so it is an honest failure. The launch gate checks the key itself.
    if (!turnstileSiteKey(providers.turnstileSiteKey)) {
      setSendError("failed");
      return;
    }

    setSending(true);
    const token = await getToken();
    // A Turnstile setup error (for example a hostname missing from the widget) is our fault, so retrying can't help.
    if (!token) return fail(turnstileConfigError() ? "failed" : "notVerified");

    let response: Response;
    try {
      response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...answers, [honeypot.name]: typeof trap === "string" ? trap : "", turnstileToken: token }),
      });
    } catch {
      return fail("failed");
    }
    const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; fields?: unknown } | null;

    if (response.ok && body?.ok === true) {
      router.push("/contact-us/thanks");
      return;
    }
    if (response.status === 400 && body?.error === "invalid" && Array.isArray(body.fields)) {
      resetTurnstile();
      setSending(false);
      const known = new Set<string>(contactFields.map((f) => f.key));
      showFieldErrors(body.fields.filter((f): f is ContactField => typeof f === "string" && known.has(f)));
      return;
    }
    if (response.status === 429) return fail("rateLimited");
    if (body?.error === "rejected") return fail("notVerified");
    return fail("failed");
  }

  function renderField(spec: ContactFieldSpec) {
    const id = `cf-${spec.key}`;
    const error = errors[spec.key];
    const shared = {
      id,
      name: spec.key,
      required: true,
      "aria-required": true as const,
      autoComplete: spec.autoComplete,
      maxLength: spec.maxLength,
      "aria-invalid": error ? ("true" as const) : undefined,
      "aria-describedby": error ? `${id}-error` : undefined,
      value: values[spec.key] ?? "",
      onChange: (ev: { target: { value: string } }) => setValues((previous) => ({ ...previous, [spec.key]: ev.target.value })),
    };
    return (
      <div key={spec.key} className={spec.key === "firstName" || spec.key === "lastName" ? "" : "sm:col-span-2"}>
        <label htmlFor={id} className={label}>
          {spec.label}
        </label>
        {spec.kind === "textarea" ? (
          <textarea {...shared} rows={6} className={`${control} min-h-[160px] py-3`} />
        ) : (
          <input {...shared} type={spec.kind} className={`${control} h-[52px]`} />
        )}
        <ErrorLine id={`${id}-error`} message={error} />
      </div>
    );
  }

  const failedMessage = siteConfig.email
    ? noteForm.sendErrors.failed.replace("{email}", siteConfig.email).replace("{phone}", siteConfig.phone)
    : `That didn't go through. Please call ${siteConfig.phone}.`;
  const sendMessage = sendError === "failed" ? failedMessage : sendError ? noteForm.sendErrors[sendError] : null;

  return (
    <div className="rounded-panel bg-dusk-deep p-5 sm:p-6 md:p-9">
      <form ref={formRef} method="post" noValidate aria-label={noteForm.formLabel} onSubmit={submit} onFocus={startTurnstile} className="space-y-6">
        <p className="text-[15px] text-mist">{noteForm.requiredNote}</p>
        <div className="grid gap-6 sm:grid-cols-2">{contactFields.map(renderField)}</div>

        {/* Spam trap: hidden from people and screen readers, out of the tab order. A filled value is refused. */}
        <div aria-hidden="true" className="sr-only">
          <label htmlFor="cf-fax">{honeypot.label}</label>
          <input id="cf-fax" name={honeypot.name} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <div>
          {/* Turnstile draws here only if Cloudflare needs the visitor to click. */}
          <div ref={turnstileRef} className="not-empty:mb-4" />
          <button
            type="submit"
            aria-disabled={sending ? "true" : undefined}
            aria-busy={sending ? "true" : undefined}
            className={`${buttonClass({ fullWidthOnMobile: true })} aria-disabled:cursor-wait aria-disabled:opacity-70`}
          >
            {noteForm.submitLabel}
          </button>
        </div>

        <div role="status">{sendMessage ? <p className="text-[15px] text-error">{sendMessage}</p> : null}</div>
      </form>
    </div>
  );
}
