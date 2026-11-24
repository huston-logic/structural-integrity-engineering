import { honeypot, needOptions, sourceOptions } from "./contact-fields";

/**
 * Contact page copy. Client-specific text is a double-bracket placeholder. The field option labels and limits live in
 * `contact-fields.ts`, which the Worker also reads (generic Worker: T4).
 */
export const contactMeta = {
  title: "[[Contact page SEO title]]",
  description: "[[Contact page SEO description]]",
};

export const contactHero = {
  eyebrow: "[[Contact eyebrow]]",
  title: "[[Contact headline]]",
  intro: "[[Contact introduction]]",
};

export const scheduler = {
  heading: "[[Scheduler heading]]",
  body: "[[Scheduler text]]",
  buttonLabel: "[[Scheduler button label]]",
  /** Shown instead of the button until `siteConfig.schedulerUrl` is set; fails the launch gate on purpose. */
  placeholder: "[[Booking link not set yet]]",
};

export const noteForm = {
  heading: "[[Contact form heading]]",
  partnerHeading: "[[Partner contact form heading]]",
  needLegend: "[[What do you need? question]]",
  needOptions,
  name: { label: "Your name" },
  email: { label: "Email" },
  business: { label: "Business name (optional)" },
  message: {
    label: "Message",
    placeholders: {
      website: "[[Example message for a website request]]",
      workflow: "[[Example message for a workflow request]]",
      other: "[[Example message for another request]]",
    },
  },
  tools: {
    label: "[[Tools question label (optional)]]",
    placeholders: {
      website: "[[Example answer]]",
      workflow: "[[Example answer]]",
      other: "[[Example answer]]",
    },
  },
  website: { label: "Current website (optional)" },
  source: {
    label: "[[How did you hear about us? question]]",
    empty: "Choose one",
    options: sourceOptions,
  },
  honeypotLabel: honeypot.label,
  privacyNote: "[[Note about what not to include in the form]]",
  submitLabel: "[[Submit button label]]",
  errors: {
    need: "Please pick one.",
    name: "Please add your name.",
    email: "That email doesn't look quite right.",
    message: "Please add a message.",
  },
  sendErrors: {
    notVerified: "That didn't go through. Please try again.",
    rateLimited: "Too many tries in a row. Wait a minute and try again.",
    failed: "[[Message shown when sending fails, with a fallback email address]]",
  },
};

export const whatHappensNext = {
  heading: "[[What happens next heading]]",
  steps: [
    { lead: "[[Step 1 lead]]", body: "[[Step 1 description]]" },
    { lead: "[[Step 2 lead]]", body: "[[Step 2 description]]" },
    { lead: "[[Step 3 lead]]", body: "[[Step 3 description]]" },
  ],
  emailLabel: "[[Prefer email? label]]",
};

export const thanks = {
  title: "[[Thank-you page title]]",
  description: "[[Thank-you page description]]",
  heading: "[[Thank-you heading]]",
  /** With the first name the form saved in sessionStorage. */
  headingWithName: "[[Thank-you heading for {firstName}]]",
  body: "[[Thank-you text, mentioning the automatic reply]]",
  /** Replaces `body` when the automatic reply failed to send but the note reached the owner. */
  bodyAutoReplyFailed: "[[Thank-you text when the automatic reply did not send]]",
  pickTimeLabel: "[[Pick a time button label]]",
  after: { lead: "[[What happens after the call? lead]]", label: "[[Link label]]", href: "/services" },
  meanwhile: {
    lead: "[[While you wait lead]]",
    links: [
      { label: "[[Link 1 label]]", href: "/services" },
      { label: "[[Link 2 label]]", href: "/about" },
    ],
  },
};

export const notFound = {
  title: "Page not found | [[Business name]]",
  heading: "Page not found",
  body: "[[404 message]]",
  homeLabel: "Back to home",
  callLabel: "[[404 secondary link label]]",
};
