import { siteConfig as base } from "../../site.config";
import { providers } from "./providers";

export const siteConfig = {
  name: base.business.name,
  /** The name in the copyright line. Falls back to the business name. */
  legalName: base.business.legalName || base.business.name,
  founder: base.owner.name,
  /** As displayed, for example "(907) 350-3456". `telHref()` (src/lib/phone.ts) makes the tel: link. */
  phone: base.owner.phone,
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? base.domain.url).replace(/\/+$/, ""),
  /** The one-line positioning. Feeds the JSON-LD description. */
  oneLiner: base.business.oneLiner,
  copyrightYear: base.business.copyrightYear,
  tagline: base.business.tagline,
  footerBrandLine: `${base.owner.name} · ${base.owner.regionLine}`,
  /** Provider-dependent values, set in `site.config.ts` and re-exported by `providers.ts`. */
  email: providers.email,
  schedulerUrl: providers.schedulerUrl,
  linkedInUrl: providers.linkedInUrl,
  turnstileSiteKey: providers.turnstileSiteKey,
} as const;

export const SCHEDULER_FALLBACK_HREF = "/contact#book";
