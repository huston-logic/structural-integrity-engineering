import { ArrowLabel } from "./Arrow";
import { HlLink } from "./HlLink";

type TextLinkProps = {
  href: string;
  children: string;
  /** Inside a paragraph: inherits the text color and keeps a permanent underline, so it is findable without hover. */
  inline?: boolean;
  /** Standalone only: mist instead of snow, medium instead of semibold (a secondary link, such as a sub-page). */
  muted?: boolean;
  /** Layout only (margins, display, wrapping); color and weight come from the props. */
  className?: string;
};

/**
 * Text link (docs/STYLE-GUIDE.md §7.10). Standalone: snow, semibold, a 44px target; it turns amber and the slow amber
 * underline draws on hover and focus. Inline: underlined in mist, amber on hover.
 */
export function TextLink({ href, children, inline = false, muted = false, className = "" }: TextLinkProps) {
  const tone = muted ? "font-medium text-mist" : "font-semibold text-snow";
  const style = inline
    ? "text-inherit underline decoration-mist/60 underline-offset-[.25em] transition-colors hover:text-amber hover:decoration-amber"
    : `inline-flex min-h-11 items-center ${tone} transition-colors hover:text-amber`;
  return (
    <HlLink href={href} className={`${style} ${className}`}>
      {inline ? children : <ArrowLabel>{children}</ArrowLabel>}
    </HlLink>
  );
}
