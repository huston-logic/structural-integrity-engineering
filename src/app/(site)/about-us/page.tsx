import type { Metadata } from "next";
import Image from "next/image";
import { ContactBand } from "@/components/hl/ContactBand";
import { Container } from "@/components/hl/Container";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { PageHero } from "@/components/hl/PageHero";
import { Section } from "@/components/hl/Section";
import { Text } from "@/components/ui/Text";
import { aboutHero, aboutMeta, mission, principal, standard, whatWeAre } from "@/content/about";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...aboutMeta, path: "/about-us" });

/** About: text hero, what we are, Dylan with his portrait, the Colorado photo with the licensing line and the mission, contact band. */
export default function AboutPage() {
  const { photo } = principal;
  return (
    <div className="relative overflow-x-clip">
      <PageHero title={aboutHero.title} intro={aboutHero.intro} drawing="about" />

      <Section tone="deep">
        <p className="max-w-[34em] text-h3 font-normal leading-snug">
          <Text>{whatWeAre}</Text>
        </p>
      </Section>

      <Section tone="dusk" labelledBy="principal-title" className="grid items-center gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-20">
        <div className="reveal-zoom overflow-hidden">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            sizes="(min-width: 1024px) 420px, 100vw"
            className="h-auto w-full max-w-[420px] object-cover lg:max-w-none"
          />
        </div>
        <div>
          <h2 id="principal-title" className="max-w-[16em] text-h2">
            <Text>{principal.heading}</Text>
          </h2>
          <p className="mt-8 max-w-[38em] text-body text-mist">
            <Text>{principal.body}</Text>
          </p>
        </div>
      </Section>

      <section aria-labelledby="places-title" className="bg-dusk-deep py-20 md:py-[104px]">
        <Container>
          <h2 id="places-title" className="max-w-[16em] text-h2">
            <Text>{standard.heading}</Text>
          </h2>
          <div className="reveal-zoom mt-12 overflow-hidden">
            <Image
              src={standard.photo.src}
              alt={standard.photo.alt}
              width={standard.photo.width}
              height={standard.photo.height}
              loading="lazy"
              sizes="(min-width: 1200px) 1136px, 100vw"
              className="aspect-[3/2] w-full object-cover md:aspect-[2/1]"
            />
          </div>
          <p className="mt-8 text-h4 font-semibold">
            <Text>{standard.line}</Text>
          </p>
          <FadingDivider className="mt-20" />
          <h2 className="mt-20 max-w-[16em] text-h2">
            <Text>{mission.heading}</Text>
          </h2>
          <p className="mt-8 max-w-[34em] text-h3 font-normal leading-snug text-mist">
            <Text>{mission.body}</Text>
          </p>
        </Container>
      </section>

      <ContactBand />
    </div>
  );
}
