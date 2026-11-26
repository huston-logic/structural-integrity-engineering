import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { resolveHref } from "@/blocks/links";
import { Section } from "@/components/hl/Section";
import { SectionIntro } from "@/components/hl/SectionIntro";
import { ServiceCards } from "@/components/hl/ServiceCards";
import { photoFile } from "@/lib/photo-files";
import type { serviceCardsDefinition } from "./definition";

export function ServiceCardsBlock({ content, headingId }: BlockProps<ContentOf<typeof serviceCardsDefinition.fields>>) {
  const items = content.items.map((item) => {
    const { width, height, small } = photoFile(item.photo.src);
    return { title: item.title, body: item.body, href: resolveHref(item.href), photo: { src: item.photo.src, alt: item.photo.alt, width, height }, small };
  });
  return (
    <Section labelledBy={headingId}>
      <SectionIntro id={headingId} heading={content.heading} intro={content.intro} />
      <ServiceCards items={items} />
    </Section>
  );
}
