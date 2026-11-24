import Image from "next/image";
import { Text } from "@/components/ui/Text";
import type { ServicePageContent } from "@/content/service-pages";
import { Arrow } from "./Arrow";
import { ContactBand } from "./ContactBand";
import { Container } from "./Container";
import { DotList } from "./DotList";
import { FadingDivider } from "./FadingDivider";
import { HlLink } from "./HlLink";
import { Section } from "./Section";

/**
 * The shared layout of the three service pages (copy deck, "Services pages"): hero with the overview, what we do with its
 * photos, what you get, a short How we work that links to the full one on /services, then the contact band.
 * Bands alternate dusk and deep and end on deep, so the dusk contact band stands apart.
 */
export function ServicePage({ page }: { page: ServicePageContent }) {
  const { heroPhoto, heroPhotoSmall, whatWeDo, whatYouGet, howWeWork } = page;
  const pair = whatWeDo.photos.length > 1;
  return (
    <div className="relative overflow-x-clip">
      <section className="bg-dusk pb-20 pt-16 md:pb-[104px] md:pt-24">
        <Container className="grid items-start gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <h1 className="max-w-[12em] text-title">
              <Text>{page.title}</Text>
            </h1>
            <p className="mt-6 max-w-[34em] text-mist">
              <Text>{page.intro}</Text>
            </p>
            <FadingDivider className="my-10 max-w-[34em]" />
            <p className="max-w-[34em] text-body">
              <Text>{page.overview}</Text>
            </p>
          </div>
          <picture className="lg:mt-3">
            <source
              media="(max-width: 767px)"
              srcSet={heroPhotoSmall.src}
              width={heroPhotoSmall.width}
              height={heroPhotoSmall.height}
            />
            <Image
              src={heroPhoto.src}
              alt={heroPhoto.alt}
              width={heroPhoto.width}
              height={heroPhoto.height}
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 600px, 100vw"
              className="aspect-[3/2] h-auto w-full object-cover"
            />
          </picture>
        </Container>
      </section>

      <Section tone="deep" labelledBy="do-title" className="grid gap-14 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
        <div>
          <h2 id="do-title" className="reveal max-w-[22em] text-h2">
            <Text>{whatWeDo.heading}</Text>
          </h2>
          <ul className="mt-10 max-w-[40em] divide-y divide-rule/60 border-y border-rule/60">
            {whatWeDo.items.map((item) => (
              <li key={item.title} className="py-6">
                <h3 className="text-h4">
                  <Text>{item.title}</Text>
                </h3>
                {item.body ? (
                  <p className="mt-2 text-small text-mist">
                    <Text>{item.body}</Text>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div className={pair ? "grid grid-cols-2 items-start gap-4 md:gap-6" : ""}>
          {whatWeDo.photos.map((photo, index) => (
            <div key={photo.src} className={`reveal-zoom overflow-hidden ${pair && index === 1 ? "mt-12 md:mt-20" : ""}`}>
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                sizes={pair ? "(min-width: 1024px) 260px, 45vw" : "(min-width: 1024px) 480px, 100vw"}
                className={`w-full object-cover ${pair ? "aspect-[4/5]" : "aspect-[4/3]"}`}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section tone="dusk" labelledBy="get-title">
        <h2 id="get-title" className="reveal max-w-[22em] text-h2">
          <Text>{whatYouGet.heading}</Text>
        </h2>
        <DotList items={whatYouGet.items} className="mt-10 max-w-[44em] space-y-5 text-body" />
      </Section>

      <Section tone="deep" spacing="compact" labelledBy="how-title">
        <h2 id="how-title" className="reveal max-w-[22em] text-h2">
          <HlLink href="/services" className="group inline-flex items-center gap-4 text-snow transition-colors hover:text-amber">
            <span className="hl-u">
              <Text>{howWeWork.heading}</Text>
            </span>
            <Arrow direction="right" />
          </HlLink>
        </h2>
        <p className="mt-8 max-w-[44em] text-body text-mist">
          <strong className="font-semibold text-snow">
            <Text>{howWeWork.stepTitle}</Text>.
          </strong>{" "}
          <Text>{howWeWork.stepBody}</Text>
        </p>
      </Section>

      <ContactBand />
    </div>
  );
}
