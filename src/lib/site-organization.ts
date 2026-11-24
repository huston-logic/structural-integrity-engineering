import { siteConfig } from "@/content/site";
import { siteConfig as base } from "../../site.config";
import { buildOrganizationJsonLd, type OrganizationJsonLd } from "./organization-jsonld";

/**
 * Feeds the builder from site.config.ts (through site.ts, for the NEXT_PUBLIC_SITE_URL override). Each optional field
 * is passed only when the site shows it: the email is in the footer and on /contact, the founder's name is in the
 * footer brand line. The owner role is not shown anywhere on the site, so it is not passed (no jobTitle).
 */
export function organizationJsonLd(): OrganizationJsonLd | null {
  return buildOrganizationJsonLd({
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.oneLiner,
    email: siteConfig.email,
    logoPath: base.brand.logo,
    founderName: siteConfig.founder,
  });
}
