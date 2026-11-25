import { seo } from "./seo";
import { siteConfig } from "./site";

/**
 * The privacy page. Every line states only what this site actually does (checked against the code on 2026-11-24):
 * the contact form has six fields; the Worker checks Turnstile, emails the site owner through Resend, sends the automatic
 * reply and adds a row to a Google Sheet; the site's own code sets no cookie and stores nothing in the browser (only the
 * Turnstile script may, which the page says); there are no ads. Grant asked for the deletion-by-email line; Dylan
 * confirms every line in the PR. Do not add a promise the site cannot keep (a deletion deadline, a legal right) without
 * Dylan's say-so.
 */
export const privacyMeta = seo.privacy;

// A legal name that ends in "Inc." already carries its full stop.
const contactDetails = `${siteConfig.legalName.replace(/\.$/, "")}. ${
  siteConfig.email ? `Email ${siteConfig.email}. ` : "[[Privacy contact email]] "
}Phone ${siteConfig.phone}.`;

const contactEmail = siteConfig.email ?? "[[Privacy contact email]]";

export const privacy = {
  heading: "Privacy Policy",
  intro: "What this site collects, and what we do with it.",
  sections: [
    { heading: "Who we are", body: contactDetails },
    {
      heading: "Information we collect",
      body: "Only what you type into the contact form: your first and last name, email, phone number, project city and state, and a description of your project. Like any website, the site also receives technical details such as your IP address and browser type when a page loads or the form is sent.",
    },
    {
      heading: "How we use it",
      body: "To answer your request and work with you on your project. We do not sell it, and we do not use it for advertising.",
    },
    {
      heading: "Who we share it with",
      body: "Only the people and services that run this site and its form. Huston Logic hosts the site on Cloudflare. Cloudflare runs the site and the form and does the spam check. Resend sends the email that tells us about your request and the automatic reply to you. Google holds a spreadsheet with a record of each request. They handle your information to run the site for us. We share it with no one else.",
    },
    {
      heading: "Cookies and analytics",
      body: "This site has no ads and sets no cookies of its own, so there are no tracking cookies. The contact form uses Cloudflare Turnstile, a spam check that checks a person, not a bot, is sending the form. It loads only when you start filling in the form, and it may use your browser's storage to do its job. Cloudflare may also count visits to the site without cookies.",
    },
    {
      heading: "How long we keep it",
      body: "For as long as we need it to answer you and work on your project.",
    },
    {
      heading: "Your choices and rights",
      body: `To ask what we hold about you, or to have it corrected or deleted, email ${contactEmail}. Please include the name and email address you used on the form so we can find it.`,
    },
    { heading: "Contact", body: contactDetails },
  ],
  lastUpdated: "Last updated November 24, 2026.",
};
