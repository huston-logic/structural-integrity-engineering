import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactBand } from "@/components/hl/ContactBand";
import { Container } from "@/components/hl/Container";
import { CellDividers } from "@/components/hl/CellDividers";
import { DotList } from "@/components/hl/DotList";
import { Faq } from "@/components/hl/Faq";
import { FadingDivider } from "@/components/hl/FadingDivider";
import { Section } from "@/components/hl/Section";
import { Text } from "@/components/ui/Text";
import {
  faq,
  howWeWork,
  serviceChoices,
  servicesHero,
  servicesMeta,
  toolsAndCodes,
  whereWeWork,
  whoWeServe,
} from "@/content/services";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...servicesMeta, path: "/services" });

/** Services: photo hero, the three service cards, who we serve, tools and codes, the six steps, glazing questions. */
export default function ServicesPage() {
  const { photo, photoSmall } = servicesHero;
  return (
    <div className="relative overflow-x-clip">
      <section className="bg-dusk pb-20 pt-16 md:pb-[104px] md:pt-24">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <h1 className="max-w-[12em] text-title">
              <Text>{servicesHero.title}</Text>
            </h1>
            <p className="mt-6 max-w-[34em] text-mist">
              <Text>{servicesHero.intro}</Text>
            </p>
          </div>
          <picture>
            <source media="(max-width: 767px)" srcSet={photoSmall.src} width={photoSmall.width} height={photoSmall.height} />
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 560px, 100vw"
              className="h-auto w-full object-cover"
            />
          </picture>
        </Container>
      </section>

      <Section tone="deep" labelledBy="choose-title">
        <h2 id="choose-title" className="reveal max-w-[22em] text-h2">
          <Text>{serviceChoices.heading}</Text>
        </h2>
        <ul className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-3">
          {serviceChoices.items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group block">
                <div className="reveal-zoom overflow-hidden">
                  <Image
                    src={item.photo.src}
                    alt=""
                    width={item.photo.width}
                    height={item.photo.height}
                    loading="lazy"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <h3 className="mt-6 text-h3 underline decoration-transparent decoration-2 underline-offset-8 transition-colors group-hover:decoration-amber">
                  <Text>{item.title}</Text>
                </h3>
                <p className="mt-3 text-small text-mist">
                  <Text>{item.body}</Text>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="dusk" labelledBy="serve-title">
        <h2 id="serve-title" className="reveal max-w-[22em] text-h2">
          <Text>{whoWeServe.heading}</Text>
        </h2>
        <DotList items={whoWeServe.items} className="mt-12 max-w-[44em] space-y-5 text-body" />
      </Section>

      <Section tone="deep" labelledBy="tools-title">
        <h2 id="tools-title" className="reveal max-w-[22em] text-h2">
          <Text>{toolsAndCodes.heading}</Text>
        </h2>
        <p className="mt-8 max-w-[44em] text-body text-mist">
          <Text>{toolsAndCodes.body}</Text>
        </p>
      </Section>

      <Section tone="dusk" labelledBy="how-title">
        <h2 id="how-title" className="reveal max-w-[22em] text-h2">
          <Text>{howWeWork.heading}</Text>
        </h2>
        <ol role="list" className="mt-12 grid list-none gap-x-12 gap-y-14 md:grid-cols-2">
          {howWeWork.steps.map((step, index) => (
            <li key={step.title} className="relative flex gap-6">
              <span aria-hidden="true" className="w-[1.4em] shrink-0 text-h2 font-light leading-none text-amber">
                {index + 1}
              </span>
              <div>
                <h3 className="text-h4 font-semibold">
                  <Text>{step.title}</Text>
                </h3>
                <p className="mt-2 text-small text-mist">
                  <Text>{step.body}</Text>
                </p>
              </div>
              <CellDividers index={index} total={howWeWork.steps.length} md={2} />
            </li>
          ))}
        </ol>
        <FadingDivider className="mt-20" />
        <h2 id="where-title" className="reveal mt-20 max-w-[22em] text-h2">
          <Text>{whereWeWork.heading}</Text>
        </h2>
        <p className="mt-8 max-w-[44em] text-body text-mist">
          <Text>{whereWeWork.body}</Text>
        </p>
      </Section>

      <Section tone="deep" labelledBy="faq-title">
        <h2 id="faq-title" className="reveal text-h2">
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
