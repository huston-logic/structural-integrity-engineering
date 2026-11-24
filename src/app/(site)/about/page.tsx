import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { Container } from "@/components/hl/Container";
import { PageHero } from "@/components/hl/PageHero";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { Text } from "@/components/ui/Text";
import { aboutBody, aboutCta, aboutHero, aboutMeta } from "@/content/about";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...aboutMeta, path: "/about" });

/** About: the hero, the story and the closing call to action. */
export default function AboutPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero eyebrow={aboutHero.eyebrow} title={aboutHero.title} intro={aboutHero.intro} />
      <section aria-labelledby="story-title" className="pb-16 md:pb-24">
        <Container>
          <h2 id="story-title" className="font-ui text-h2 font-bold">
            <Text>{aboutBody.heading}</Text>
          </h2>
          <div className="mt-8 max-w-[64ch] space-y-5 text-body">
            {aboutBody.paragraphs.map((paragraph) => (
              <p key={paragraph}>
                <Text>{paragraph}</Text>
              </p>
            ))}
          </div>
        </Container>
      </section>
      <ClosingCta heading={aboutCta.heading} body={aboutCta.body}>
        <Button href={bookCallHref()}>{aboutCta.cta}</Button>
      </ClosingCta>
    </div>
  );
}
