export type NavItem = { label: string; href: string };

// CLIENT: replace if the client's site has different pages.
export const headerNav: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerLinks: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const privacyLink: NavItem = { label: "Privacy", href: "/privacy" };

/** The mobile menu button's text; `aria-expanded` says whether it is open. */
export const menuLabel = "Menu";
