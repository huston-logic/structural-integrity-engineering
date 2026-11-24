import type { Metadata } from "next";
import { Container } from "@/components/hl/Container";
import { ContactForm } from "@/components/hl/ContactForm";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { TextLink } from "@/components/hl/TextLink";
import { Text } from "@/components/ui/Text";
import { contactHero, contactMeta } from "@/content/contact";
import { siteConfig } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { telHref } from "@/lib/phone";

export const metadata: Metadata = pageMetadata({ ...contactMeta, path: "/contact-us" });

/**
 * Contact, form first (copy deck: "None (form first)"): from 900px the headline, the line and the direct email and
 * phone stay in the left column while the six-field form fills the right; on phones they stack above the form.
 */
export default function ContactPage() {
  const tel = telHref(siteConfig.phone);
  return (
    <div className="relative overflow-x-clip">
      <section className="bg-dusk pb-16 pt-12 md:pb-24 md:pt-24">
        <Container className="grid items-start gap-12 min-[900px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[900px]:gap-16 lg:gap-24">
          <div className="min-[900px]:sticky min-[900px]:top-[calc(var(--hl-header-h)+48px)]">
            <h1 className="max-w-[10em] text-title">
              <Text>{contactHero.title}</Text>
            </h1>
            <p className="mt-6 max-w-[30em] text-mist">
              <Text>{contactHero.intro}</Text>
            </p>
            <FadingDivider className="my-8 max-w-[30em]" />
            <div className="flex flex-col items-start">
              {siteConfig.email ? (
                <TextLink href={`mailto:${siteConfig.email}`} className="[overflow-wrap:anywhere]">
                  {siteConfig.email}
                </TextLink>
              ) : null}
              {tel ? <TextLink href={tel}>{siteConfig.phone}</TextLink> : null}
            </div>
          </div>
          <ContactForm />
        </Container>
      </section>
    </div>
  );
}
