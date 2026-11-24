"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/hl/Button";
import { HlLink } from "@/components/hl/HlLink";
import { Text } from "@/components/ui/Text";
import { headerNav, menuLabel, requestQuote, type NavGroup, type NavItem } from "@/content/nav";

/** The page itself is marked aria-current; its parent menu item (Services on a service page) only looks active. */
function linkState(pathname: string, href: string) {
  if (href.includes("#")) return {};
  if (pathname === href) return { "aria-current": "page" as const };
  if (href !== "/" && pathname.startsWith(`${href}/`)) return { "data-active": "true" };
  return {};
}

// The current page and its section carry a 2px amber underline, so the state is not shown by color alone.
const marked =
  "decoration-amber decoration-2 underline-offset-[10px] aria-[current=page]:underline data-[active=true]:underline";
const desktopLink = `inline-flex min-h-11 items-center gap-1.5 text-nav font-semibold text-snow transition-colors hover:text-amber ${marked}`;
const subLink =
  "flex min-h-11 items-center rounded-field px-3 text-small font-medium text-snow transition-colors hover:bg-dusk hover:text-amber aria-[current=page]:text-amber";
const mobileLink = `flex min-h-14 items-center text-[22px] font-medium tracking-[-0.01em] text-snow ${marked}`;
const mobileSubLink = `flex min-h-11 items-center text-body text-mist ${marked}`;

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="hl-chevron size-3 text-mist" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  );
}

/**
 * The menu (copy deck: Services with its three pages, About, Contact, a Request a quote button).
 *
 * From 1024px: a row of links. The Services submenu opens on hover and while keyboard focus is inside it (CSS, so it
 * works without JavaScript; `.hl-sub` in hl.css). Escape closes it; it reopens when the pointer leaves or focus moves
 * on. Below 1024px: a Menu button opens a panel with every link and the button. Without JavaScript the footer still
 * links every page.
 */
export function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const [subDismissed, setSubDismissed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const subRef = useRef<HTMLLIElement>(null);
  // The mobile menu closes by itself when the page changes.
  const menuOpen = open && openedAt === pathname;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const sub = subRef.current;
      if (sub?.contains(document.activeElement)) sub.querySelector<HTMLAnchorElement>("a")?.focus();
      if (sub && (sub.matches(":hover") || sub.contains(document.activeElement))) setSubDismissed(true);
      if (menuOpen) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // After a click in the Services item the pointer and focus are still on it, which would keep the submenu open on the
  // next page.
  const afterSubClick = () => {
    setSubDismissed(true);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const desktopItem = (item: NavGroup) =>
    item.children ? (
      <li
        key={item.href}
        ref={subRef}
        className="hl-has-sub relative"
        data-dismissed={subDismissed}
        onMouseLeave={() => setSubDismissed(false)}
        onFocus={() => setSubDismissed(false)}
      >
        <HlLink href={item.href} {...linkState(pathname, item.href)} className={desktopLink} onClick={afterSubClick}>
          <Text>{item.label}</Text>
          <Chevron />
        </HlLink>
        <div className="hl-sub">
          <ul className="w-[280px] rounded-panel border border-rule bg-dusk-deep p-2">
            {item.children.map((child: NavItem) => (
              <li key={child.href}>
                <HlLink href={child.href} {...linkState(pathname, child.href)} className={subLink} onClick={afterSubClick}>
                  <Text>{child.label}</Text>
                </HlLink>
              </li>
            ))}
          </ul>
        </div>
      </li>
    ) : (
      <li key={item.href}>
        <HlLink href={item.href} {...linkState(pathname, item.href)} className={desktopLink}>
          <Text>{item.label}</Text>
        </HlLink>
      </li>
    );

  return (
    <>
      <nav aria-label="Main" className="hidden justify-self-end lg:block">
        <ul className="flex items-center gap-9">
          {headerNav.map(desktopItem)}
          <li className="ml-1">
            <Button href={requestQuote.href} size="compact">
              {requestQuote.label}
            </Button>
          </li>
        </ul>
      </nav>

      <div className="flex justify-end lg:hidden">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => {
            setOpenedAt(pathname);
            setOpen((value) => !value);
          }}
          className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-2.5 rounded-pill px-2 text-nav font-semibold text-snow"
        >
          <span>{menuLabel}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="hl-menu-icon size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="8" x2="21" y2="8" />
            <line x1="3" y1="16" x2="21" y2="16" />
          </svg>
        </button>
      </div>

      <nav id="mobile-menu" aria-label="Mobile" data-open={menuOpen} inert={!menuOpen} className="panel col-span-full lg:hidden">
        <div className="panel-inner">
          <ul className="border-t border-rule pt-2">
            {headerNav.map((item) => (
              <li key={item.href} className="border-b border-rule py-1">
                <HlLink href={item.href} {...linkState(pathname, item.href)} className={mobileLink} onClick={() => setOpen(false)}>
                  <Text>{item.label}</Text>
                </HlLink>
                {item.children ? (
                  <ul className="mb-3 ml-0.5 border-l border-rule pl-5">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <HlLink href={child.href} {...linkState(pathname, child.href)} className={mobileSubLink} onClick={() => setOpen(false)}>
                          <Text>{child.label}</Text>
                        </HlLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="pb-8 pt-7">
            <Button href={requestQuote.href} fullWidthOnMobile onClick={() => setOpen(false)}>
              {requestQuote.label}
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
