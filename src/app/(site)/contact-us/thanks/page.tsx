import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { PageHero } from "@/components/hl/PageHero";
import { thanks } from "@/content/contact";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: thanks.title,
  description: thanks.description,
  path: "/contact-us/thanks",
  noindex: true,
});

/** Thanks: the copy deck's "After sending" line. Static; it reads nothing from the form. */
export default function ThanksPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero title={thanks.heading} intro={thanks.body}>
        <Button href="/" fullWidthOnMobile>
          {thanks.homeLabel}
        </Button>
      </PageHero>
    </div>
  );
}
