import { bookCallHref } from "@/components/ui/BookCallButton";
import { BOOKING_LINK, CONTACT_PATH } from "./schema.ts";

/** The address a link field points to: `@booking` becomes the site's booking link (the contact page when the site has none), anything else is used as written. */
export function resolveHref(href: string): string {
  return href === BOOKING_LINK ? (bookCallHref() ?? CONTACT_PATH) : href;
}
