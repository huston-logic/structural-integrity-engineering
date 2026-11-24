/**
 * Optional provider settings (`contact.schedulerUrl`, `contact.linkedInUrl`). Three states:
 * a real URL (shown), "none" (the owner has decided there is none: pages omit it and the launch gate passes) and
 * null (not decided yet: the launch gate fails). Import-free, because the contact Worker bundles it.
 */
export const NONE = "none";

/** The URL when one is set; null for "none" and for not set yet. */
export function settingUrl(value: string | null | undefined): string | null {
  return value && value !== NONE ? value : null;
}
