import { confirmation, contactFields, fieldLabel, type ContactKey } from "./contact-fields";
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

/** Functional messages built from the deck's field labels (the deck gives no error text). */
const requiredError = (key: ContactKey) => `${fieldLabel(key)} is required.`;

export const noteForm = {
  /** Names the form for screen readers; it is the deck's button label. */
  formLabel: "Send request",
  submitLabel: "Send request",
  /** The deck says every field is required. */
  requiredNote: "All fields are required.",
  fields: contactFields,
  errors: {
    firstName: requiredError("firstName"),
    lastName: requiredError("lastName"),
    email: `Enter a valid ${fieldLabel("email").toLowerCase()} address.`,
    phone: `Enter a valid ${fieldLabel("phone").toLowerCase()} number.`,
    location: requiredError("location"),
    scope: requiredError("scope"),
  } satisfies Record<ContactKey, string>,
  sendErrors: {
    notVerified: "That didn't go through. Please try again.",
    rateLimited: "Too many tries in a row. Please try again shortly.",
    /** `{email}` and `{phone}` are the direct contact details from site.config.ts. */
    failed: "That didn't go through. Please email {email} or call {phone}.",
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
  body: "[[404 message]]",
  homeLabel: "Back to home",
};
