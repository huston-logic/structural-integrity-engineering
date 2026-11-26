import Link from "next/link";
import type { ReactNode } from "react";
import { FILE_LINK_RE } from "@/blocks/schema";
import { fileLink } from "@/content/files";

type HlLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  "aria-current"?: "page";
  /** Marks the menu item whose section holds the current page (styling only). */
  "data-active"?: string;
  onClick?: () => void;
};

const WEB_LINK = /^(https?:)?\/\//;
const APP_LINK = /^(mailto|tel|sms):/;
/** A same-site file such as /grant.vcf: next/link would prefetch it and try to route to it as a page. */
const FILE_LINK = /^\/[^?#]*\.[a-z0-9]+(?:[?#].*)?$/i;

function isPlainAnchor(href: string) {
  return WEB_LINK.test(href) || APP_LINK.test(href) || FILE_LINK.test(href);
}

/**
 * Pages on this site use next/link. External http(s) links open in a new tab with noopener noreferrer (AGENTS.md);
 * mailto:, tel:, sms: and same-site files are plain anchors in the same tab.
 */
export function HlLink({ href, className, children, "aria-current": ariaCurrent, "data-active": dataActive, onClick }: HlLinkProps) {
  if (isPlainAnchor(href)) {
    const opensNewTab = WEB_LINK.test(href);
    const isPdf = FILE_LINK_RE.test(href);
    return (
      <a
        href={href}
        className={className}
        aria-current={ariaCurrent}
        data-active={dataActive}
        onClick={onClick}
        {...(opensNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...(isPdf ? { download: "" } : {})}
      >
        {children}
        {isPdf ? <span className="ml-2.5 rounded-pill border border-current px-2 py-1 text-tag font-medium">{fileLink.note}</span> : null}
      </a>
    );
  }
  return (
    <Link href={href} className={className} aria-current={ariaCurrent} data-active={dataActive} onClick={onClick}>
      {children}
    </Link>
  );
}
