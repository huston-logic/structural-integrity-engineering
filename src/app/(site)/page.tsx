import type { Metadata } from "next";
import { ConditionList } from "@/components/hl/ConditionList";
import { ContactBand } from "@/components/hl/ContactBand";
import { FigureList } from "@/components/hl/FigureList";
import { HomeHero } from "@/components/hl/HomeHero";
import { ReasonGrid } from "@/components/hl/ReasonList";
import { Section } from "@/components/hl/Section";
import { SectionIntro } from "@/components/hl/SectionIntro";
import { ServiceCards } from "@/components/hl/ServiceCards";
import { JsonLd } from "@/components/ui/JsonLd";
import { Text } from "@/components/ui/Text";
import { conditions, homeMeta, numbers, reasons, services } from "@/content/home";
import { pageMetadata } from "@/lib/metadata";
import { organizationJsonLd } from "@/lib/site-organization";

export const metadata: Metadata = pageMetadata({ ...homeMeta, path: "/" });

/**
 * Home, option G "Dusk" (copy deck, Home): the hero with the line drawing, the design conditions, the three services,
 * then the numbers and the reasons in one deep band, so the dusk contact band follows a deep section.
 */
export default function HomePage() {
  const organization = organizationJsonLd();
  return (
    <>
      {organization ? <JsonLd data={organization} /> : null}
      <HomeHero />

      <Section tone="deep" labelledBy="conditions-title">
        <SectionIntro id="conditions-title" heading={conditions.heading} intro={conditions.intro} />
        <ConditionList items={conditions.items} />
      </Section>

      <Section labelledBy="services-title">
        <SectionIntro id="services-title" heading={services.heading} intro={services.intro} />
        <ServiceCards items={services.items} />
      </Section>

      <Section tone="deep" labelledBy="reasons-title">
        <FigureList items={numbers.items} />
        <h2 id="reasons-title" className="reveal mt-24 max-w-[22em] text-h2 md:mt-[136px]">
          <Text>{reasons.heading}</Text>
        </h2>
        <ReasonGrid items={reasons.items} className="mt-12" />
      </Section>

      <ContactBand />
    </>
  );
}
