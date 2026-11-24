import Link from "next/link";
import { Text } from "@/components/ui/Text";
import { siteConfig } from "@/content/site";

// CLIENT: replace the text with the client's logo (an SVG in public/brand/) and keep the link and aria-label.
const sizes = {
  header: "text-[20px] md:text-[22px]",
  footer: "text-[20px]",
} as const;

/** The business name as text, linking home. */
export function Logo({ size = "header" }: { size?: keyof typeof sizes }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name}, home`}
      className={`inline-flex min-h-11 items-center rounded-btn font-ui font-semibold text-ink ${sizes[size]}`}
    >
      <Text>{siteConfig.name}</Text>
    </Link>
  );
}
