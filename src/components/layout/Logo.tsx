import Link from "next/link";
import { Text } from "@/components/ui/Text";
import { siteConfig } from "@/content/site";

// There is no logo file yet, so the wordmark is the business name set in Manrope 700, as in the option G reference.
// When a logo arrives (public/brand/), swap the text for it and keep the link and aria-label.

/** The business name as a text wordmark, linking home. */
export function Logo() {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name}, home`}
      className="inline-flex min-h-11 items-center text-wordmark font-bold text-snow transition-colors hover:text-amber"
    >
      <Text>{siteConfig.name}</Text>
    </Link>
  );
}
