import { confirmation, contactFields, type ContactKey } from "./contact-fields";
import { seo } from "./seo";
import { siteConfig } from "./site";

/**
 * Contact page copy, from the copy deck (Contact). The six field labels live in `contact-fields.ts`, which the Worker
 * also reads. Anything the deck does not give is a double-bracket placeholder.
 */
export const contactMeta = seo.contact;

export const contactHero = {
  title: "Let's get in touch.",
  intro: "We're here to help you move forward with clarity and confidence. Send us your plans or questions and we'll respond as fast as we can.",
};

/** Error messages in the site's voice (short, practical). The deck gives no error text; Grant approves these in the PR. */

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
