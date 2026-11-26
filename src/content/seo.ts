import { siteConfig } from "../../site.config.ts";

/**
 * Titles and meta descriptions of the pages that are not page files. Every page in src/content/pages/ carries its own
 * title and description in its file; this is the one noindex page that is still a route (the thank-you page). Its text is
 * the copy deck's "After sending" line (src/lib/seo.test.ts checks it). No imports except the import-free
 * site.config.ts, so Node's test runner can load this file.
 */
const name = siteConfig.business.name;
const withName = (headline: string) => `${headline} | ${name}`;

export type SeoEntry = {
  title: string;
  description: string;
};

export const seo = {
  thanks: {
    title: withName("Thanks"),
    description: "Your request is in, and Dylan will reply within 48 hours.",
  },
} as const satisfies Record<string, SeoEntry>;

export type SeoKey = keyof typeof seo;
