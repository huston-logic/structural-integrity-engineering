import type { Metadata } from "next";
import { ContactBand } from "@/components/hl/ContactBand";
import { PageHero } from "@/components/hl/PageHero";
import { Section } from "@/components/hl/Section";
import { Text } from "@/components/ui/Text";
import { aboutBody, aboutHero, aboutMeta } from "@/content/about";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({ ...aboutMeta, path: "/about" });

/** About (template content until task 9): the hero, the story and the contact band. */
export default function AboutPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero eyebrow={aboutHero.eyebrow} title={aboutHero.title} intro={aboutHero.intro} />
      <Section tone="deep" labelledBy="story-title">
        <h2 id="story-title" className="text-h2">
          <Text>{aboutBody.heading}</Text>
        </h2>
        <div className="mt-8 max-w-[64ch] space-y-5 text-mist">
          {aboutBody.paragraphs.map((paragraph) => (
            <p key={paragraph}>
              <Text>{paragraph}</Text>
            </p>
          ))}
        </div>
      </Section>
      <ContactBand />
    </div>
  );
}
