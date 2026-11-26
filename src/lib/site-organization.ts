import { siteConfig } from "@/content/site";
import { siteConfig as base } from "../../site.config";
import { getBusiness } from "./settings";
import { buildOrganizationJsonLd, type OrganizationJsonLd } from "./organization-jsonld";

/**
 * Feeds the builder from the business details (business.json: name, email), the logo and site.config.ts (through site.ts,
 * for the NEXT_PUBLIC_SITE_URL override). The logo is the drawn mark in site.config.ts `brand.logo`: brand is fixed on
 * this site (docs/SITE-DIFFERENCES.md, D11). Each optional field is passed only when the site shows it: the email is in
 * the footer and on /contact-us, the founder's name is in the
 * footer brand line. The owner role is not shown anywhere on the site, so it is not passed (no jobTitle).
 */
export function organizationJsonLd(): OrganizationJsonLd | null {
  const business = getBusiness();
  return buildOrganizationJsonLd({
    name: business.name,
    url: siteConfig.url,
    description: siteConfig.oneLiner,
    email: business.email,
    logoPath: base.brand.logo,
    founderName: siteConfig.founder,
  });
}
