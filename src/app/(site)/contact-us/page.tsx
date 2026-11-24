import type { Metadata } from "next";
import { Container } from "@/components/hl/Container";
import { ContactForm } from "@/components/hl/ContactForm";
import { PageHero } from "@/components/hl/PageHero";
import { TextLink } from "@/components/hl/TextLink";
import { contactHero, contactMeta } from "@/content/contact";
import { siteConfig } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";
import { telHref } from "@/lib/phone";

export const metadata: Metadata = pageMetadata({ ...contactMeta, path: "/contact-us" });

/** Contact: the copy deck's headline and line, the direct email and phone, and the six-field form. */
export default function ContactPage() {
  const tel = telHref(siteConfig.phone);
  return (
    <div className="relative overflow-x-clip">
      <PageHero title={contactHero.title} intro={contactHero.intro} />

      <section className="pb-16 md:pb-24">
        <Container className="grid items-start gap-12 min-[900px]:grid-cols-[4fr_8fr] min-[900px]:gap-16">
          <div className="flex flex-col items-start">
            {siteConfig.email ? (
              <TextLink href={`mailto:${siteConfig.email}`} className="[overflow-wrap:anywhere]">
                {siteConfig.email}
              </TextLink>
            ) : null}
            {tel ? <TextLink href={tel}>{siteConfig.phone}</TextLink> : null}
          </div>
          <ContactForm />
        </Container>
      </section>
    </div>
  );
}
