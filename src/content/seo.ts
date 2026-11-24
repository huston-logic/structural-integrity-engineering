import { siteConfig } from "../../site.config.ts";

/**
 * Page titles and meta descriptions. The copy deck has no SEO text, so every entry is built only from deck text
 * (src/lib/seo.test.ts checks it): the title is the page's hero headline plus the business name, and the description is
 * whole sentences taken word for word from the page's hero or intro. No imports except the import-free site.config.ts,
 * so Node's test runner can load this file.
 */
const name = siteConfig.business.name;
const withName = (headline: string) => `${headline} | ${name}`;

export type SeoEntry = {
  title: string;
  /** null only for the privacy page: the deck has no text to build one from, and an invented line is not allowed. */
  description: string | null;
};

export const seo = {
  home: {
    title: name,
    description: "Structural engineering for homes, low-rise commercial buildings and glazing systems in Colorado and Alaska.",
  },
  services: {
    title: withName("Structural engineering services"),
    description: "Fast, accurate, permit-ready plans for homes, low-rise commercial buildings and glazing systems.",
  },
  residential: {
    title: withName("Residential structural design"),
    description: "Permit-ready plans for custom homes, remodels, additions, decks and foundations. Fast, accurate and affordable.",
  },
  commercial: {
    title: withName("Commercial design"),
    description: "Permit-ready engineering for retail, office buildings and tenant improvements.",
  },
  glazing: {
    title: withName("Glazing engineering"),
    description: "Stamped calculation packages and redlines for storefront and curtainwall systems. Fast, accurate and affordable.",
  },
  about: {
    title: withName("Structural design, simplified"),
    description: "Responsive communication, modern tools and permit-ready plans you can build on.",
  },
  contact: {
    title: withName("Let's get in touch"),
    description:
      "We're here to help you move forward with clarity and confidence. Send us your plans or questions and we'll respond as fast as we can.",
  },
  privacy: {
    title: withName("Privacy Policy"),
    description: null,
  },
  /** noindex pages. The thanks text is the deck's "After sending" line. */
  thanks: {
    title: withName("Thanks"),
    description: "Your request is in, and Dylan will reply within 48 hours.",
  },
} as const satisfies Record<string, SeoEntry>;

export type SeoKey = keyof typeof seo;
