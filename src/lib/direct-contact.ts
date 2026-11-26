// The phone number and public email the site shows (footer, contact page, contact band and the contact form's error line). They
// come from business.json (docs/SITE-DIFFERENCES.md, D13). The tel: link is this site's own `telHref` (+1 for a
// 10-digit number), so the links stay as they were. Server only; the contact form is a client component and is passed these.
import { telHref } from "./phone.ts";
import { getBusiness } from "./settings.ts";

export type DirectContact = { phone: string; tel: string | null; email: string | null };

export function directContact(): DirectContact {
  const business = getBusiness();
  const email = business.email.trim();
  return { phone: business.phone, tel: telHref(business.phone), email: email === "" ? null : email };
}
