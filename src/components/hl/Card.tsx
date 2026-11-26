import type { ReactNode } from "react";
import { HlLink } from "./HlLink";

type CardProps = {
  children: ReactNode;
  /** With an href the card is a link that lifts 2px on hover and focus (the compact hero door, §7.5). */
  href?: string;
  as?: "div" | "article" | "figure" | "li";
  className?: string;
};

/**
 * A box for something you could hold: a page, a message, a spreadsheet, a screenshot (§4). Lists of ideas are not
 * boxed; they use FadingDivider. Padding is left to the caller. On Dusk it is a dark box (dusk-deep, rule border), so
 * the snow text and mist muted text inside keep AA contrast.
 */
export function Card({ children, href, as: Tag = "div", className = "" }: CardProps) {
  if (href) {
    return (
      <HlLink
        href={href}
        className={`block rounded-card border border-rule bg-tint text-snow transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5 ${className}`}
      >
        {children}
      </HlLink>
    );
  }
  return <Tag className={`rounded-card border border-rule bg-tint text-snow ${className}`}>{children}</Tag>;
}
