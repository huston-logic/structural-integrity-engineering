import { seo } from "./seo";
import { siteConfig } from "./site";

/**
 * Privacy policy SKELETON. Only the business name and the contact details are filled in (from site.config.ts); they
 * are facts the site already shows. Every other section stays a placeholder on purpose: the client (and their lawyer)
 * must write or approve it before launch. Do not fill it in from another site's policy.
 */
export const privacyMeta = seo.privacy;

const contactDetails = `${siteConfig.legalName}. ${
  siteConfig.email ? `Email ${siteConfig.email}. ` : "[[Privacy contact email]] "
}Phone ${siteConfig.phone}.`;

export const privacy = {
  heading: "Privacy Policy",
  reviewNote: "[[Grant to review: privacy page]]",
  sections: [
    { heading: "Who we are", body: contactDetails },
    { heading: "Information we collect", body: "[[What the contact form, scheduling tool and analytics collect]]" },
    { heading: "How we use it", body: "[[Purposes for using the information]]" },
    { heading: "Who we share it with", body: "[[Service providers that process the information, and any other recipients]]" },
    { heading: "Cookies and analytics", body: "[[Cookies, analytics and bot-check services in use]]" },
    { heading: "How long we keep it", body: "[[Retention period]]" },
    { heading: "Your choices and rights", body: "[[How to access, correct or delete information, and any rights that apply]]" },
    { heading: "Contact", body: contactDetails },
  ],
  lastUpdated: "[[Last updated date]]",
};
