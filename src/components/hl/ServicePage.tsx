import Image from "next/image";
import { Text } from "@/components/ui/Text";
import type { ServicePageContent } from "@/content/service-pages";
import { ContactBand } from "./ContactBand";
import { Container } from "./Container";
import { DotList } from "./DotList";
import { FadingDivider } from "./FadingDivider";
import { HlLink } from "./HlLink";
import { Section } from "./Section";
import { SplitSection } from "./SplitSection";

/**
 * The shared layout of the three service pages (copy deck, "Services pages"): hero with the overview, what we do with its
 * photos, what you get, a short How we work that links to the full one on /services, then the contact band.
 * Bands alternate dusk and deep and end on deep, so the dusk contact band stands apart. Only the photos move
 * (`.reveal-zoom`); the headings are static.
 */
export function ServicePage({ page }: { page: ServicePageContent }) {
  const { heroPhoto, heroPhotoSmall, whatWeDo, whatYouGet, howWeWork } = page;
  const pair = whatWeDo.photos.length > 1;
  const titlesOnly = whatWeDo.items.every((item) => !item.body);
  return (
    <div className="relative overflow-x-clip">
      <section className="bg-dusk pb-20 pt-12 md:pb-[104px] md:pt-24">
        {/* Phones: title, photo, overview, so the photo is on the first screen. From lg: the title and the overview in the
            left column, the photo beside them spanning both rows. */}
        <Container className="grid items-start gap-y-10 lg:grid-cols-[1fr_1fr] lg:gap-x-20 lg:gap-y-0">
          <div className="lg:col-start-1 lg:row-start-1">
            <h1 className="max-w-[12em] text-title">
              <Text>{page.title}</Text>
            </h1>
            <p className="mt-6 max-w-[34em] text-mist">
              <Text>{page.intro}</Text>
            </p>
          </div>
          <picture className="lg:col-start-2 lg:row-[1/span_2] lg:mt-3">
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
          <div className="lg:col-start-1 lg:row-start-2">
            <FadingDivider className="mb-10 mt-10 hidden max-w-[34em] lg:block" />
            <p className="max-w-[34em] text-body">
              <Text>{page.overview}</Text>
            </p>
          </div>
        </Container>
      </section>

      <Section tone="deep" labelledBy="do-title" className="grid gap-14 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
        <div>
          <h2 id="do-title" className="max-w-[22em] text-h2">
            <Text>{whatWeDo.heading}</Text>
          </h2>
          <ul className="mt-10 max-w-[40em] divide-y divide-rule/60 border-y border-rule/60">
            {whatWeDo.items.map((item) => (
              <li key={item.title} className={titlesOnly ? "py-5" : "py-6"}>
                {/* A list of names alone reads as an index, so it gets the larger card-title size. */}
                <h3 className={titlesOnly ? "text-h3 font-medium" : "text-h4"}>
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
        {/* From lg the photos stay in view beside the list while it scrolls (sticky, no JavaScript). */}
        <div
          className={`lg:sticky lg:top-[calc(var(--hl-header-h)+48px)] lg:self-start ${pair ? "grid grid-cols-2 items-start gap-4 md:gap-6" : ""}`}
        >
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

      <SplitSection id="get-title" tone="dusk" heading={<Text>{whatYouGet.heading}</Text>}>
        <DotList items={whatYouGet.items} className="max-w-[40em] space-y-5 text-body" />
      </SplitSection>

      <SplitSection
        id="how-title"
        tone="deep"
        spacing="compact"
        heading={
          <HlLink
            href="/services"
            className="text-snow underline decoration-mist/60 decoration-2 underline-offset-[0.18em] transition-colors hover:text-amber hover:decoration-amber"
          >
            <Text>{howWeWork.heading}</Text>
          </HlLink>
        }
      >
        <p className="max-w-[40em] text-body text-mist">
          <strong className="font-semibold text-snow">
            <Text>{howWeWork.stepTitle}</Text>.
          </strong>{" "}
          <Text>{howWeWork.stepBody}</Text>
        </p>
      </SplitSection>

      <ContactBand />
    </div>
  );
}
