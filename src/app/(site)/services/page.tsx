import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { Container } from "@/components/hl/Container";
import { Faq } from "@/components/hl/Faq";
import { PageHero } from "@/components/hl/PageHero";
import { ReasonList } from "@/components/hl/ReasonList";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { Text } from "@/components/ui/Text";
import { faq, serviceList, servicesCta, servicesHero, servicesMeta } from "@/content/services";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...servicesMeta, path: "/services" });

/** Services: the hero, the list of services, an FAQ and the closing call to action. */
export default function ServicesPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero eyebrow={servicesHero.eyebrow} title={servicesHero.title} intro={servicesHero.intro} />
      <ReasonList id="services" heading={serviceList.heading} items={serviceList.items} />
      <section aria-labelledby="faq-title" className="py-16 md:py-24">
        <Container>
          <h2 id="faq-title" className="font-ui text-h2 font-bold">
            <Text>{faq.heading}</Text>
          </h2>
          <div className="mt-8 max-w-[760px]">
            <Faq items={faq.items} />
          </div>
        </Container>
      </section>
      <ClosingCta heading={servicesCta.heading} body={servicesCta.body}>
        <Button href={bookCallHref()}>{servicesCta.cta}</Button>
      </ClosingCta>
    </div>
  );
}
