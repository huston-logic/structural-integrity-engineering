export type NavItem = { label: string; href: string };
/** A menu item; `children` are its sub-pages (the Services submenu). */
export type NavGroup = NavItem & { children?: readonly NavItem[] };

// The menu from the copy deck: Services (with its three pages), About, Contact, and a Request a quote button. The
// addresses are the old Wix ones, kept so no link breaks.
export const servicePages: readonly NavItem[] = [
  { label: "Residential", href: "/services/residential-structural-design" },
  { label: "Low-rise commercial", href: "/services/low-rise-commercial-structural-design" },
  { label: "Glazing and mullion", href: "/services/glazing-and-mullion-engineering" },
];

export const headerNav: readonly NavGroup[] = [
  { label: "Services", href: "/services", children: servicePages },
  { label: "About", href: "/about-us" },
  { label: "Contact", href: "/contact-us" },
];

/** The menu's button, and the action in the contact band at the end of every page. */
export const requestQuote: NavItem = { label: "Request a quote", href: "/contact-us" };

/** The footer repeats the menu links. */
export const footerLinks: readonly NavGroup[] = headerNav;

export const privacyLink: NavItem = { label: "Privacy", href: "/privacy" };

/** The mobile menu button's text; `aria-expanded` says whether it is open. */
export const menuLabel = "Menu";
