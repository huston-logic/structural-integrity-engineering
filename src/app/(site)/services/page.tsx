import type { Metadata } from "next";
import { ContactBand } from "@/components/hl/ContactBand";
import { Faq } from "@/components/hl/Faq";
import { PageHero } from "@/components/hl/PageHero";
import { ReasonList } from "@/components/hl/ReasonList";
import { Section } from "@/components/hl/Section";
import { Text } from "@/components/ui/Text";
import { faq, serviceList, servicesHero, servicesMeta } from "@/content/services";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...servicesMeta, path: "/services" });

/** Services (template content until task 7): the hero, the list of services, an FAQ and the contact band. */
export default function ServicesPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero eyebrow={servicesHero.eyebrow} title={servicesHero.title} intro={servicesHero.intro} />
      <ReasonList id="services" tone="dusk" heading={serviceList.heading} items={serviceList.items} />
      <Section tone="deep" labelledBy="faq-title">
        <h2 id="faq-title" className="text-h2">
          <Text>{faq.heading}</Text>
        </h2>
        <div className="mt-8 max-w-[760px]">
          <Faq items={faq.items} />
        </div>
      </Section>
      <ContactBand />
    </div>
  );
}
