import { SCHEDULER_FALLBACK_HREF, siteConfig } from "@/content/site";
import { NONE } from "@/lib/optional-setting";

/**
 * Every "book a call" CTA resolves its target here, so one setting in `site.config.ts` switches them all.
 * Returns null when the owner has no booking link ("none"): callers then leave the CTA out.
 */
export function bookCallHref(): string | null {
  if (siteConfig.schedulerUrl === NONE) return null;
  return siteConfig.schedulerUrl ?? SCHEDULER_FALLBACK_HREF;
}
