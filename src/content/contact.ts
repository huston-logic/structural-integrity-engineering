import { confirmation, contactFields, type ContactKey } from "./contact-fields";
import { seo } from "./seo";
import { siteConfig } from "./site";

/**
 * Contact form, thank-you page and 404 copy, from the copy deck (Contact). The contact page's own headline and line are
 * in src/content/pages/contact-us.json. The six field labels live in `contact-fields.ts`, which the Worker also reads.
 * Anything the deck does not give is a double-bracket placeholder.
 */

/** The field and send error messages are in the site's voice (short, practical). The deck gives no error text; Grant approves them in the PR. */
export const noteForm = {
  /** Names the form for screen readers; it is the deck's button label. */
  formLabel: "Send request",
  submitLabel: "Send request",
  /** The deck says every field is required. */
  requiredNote: "All fields are required.",
  fields: contactFields,
  errors: {
    firstName: "Add your first name.",
    lastName: "Add your last name.",
    email: "That email doesn't look right. Check it and try again.",
    phone: "That phone number doesn't look right. Use 7 to 15 digits.",
    location: "Add the project city and state.",
    scope: "Tell us a little about the project.",
  } satisfies Record<ContactKey, string>,
  sendErrors: {
    notVerified: "The spam check didn't pass. Try again in a moment.",
    rateLimited: "That's a lot of tries in a row. Give it a minute, then send again.",
    /** `{email}` and `{phone}` are the direct contact details from site.config.ts. */
    failed: "That didn't go through. Email {email} or call {phone}.",
    /** Used when no site email is set yet. */
    failedNoEmail: "That didn't go through. Call {phone}.",
  },
};

export const thanks = {
  title: seo.thanks.title,
  description: seo.thanks.description,
  heading: confirmation.heading,
  body: confirmation.body,
  homeLabel: "Back to home",
};

export const notFound = {
  title: `Page not found | ${siteConfig.name}`,
  heading: "Page not found",
  body: "That page isn't here. The link may be old or mistyped. Head back home, or request a quote.",
  homeLabel: "Back to home",
};
