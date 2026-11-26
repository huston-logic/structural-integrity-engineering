import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { ServiceHero } from "@/components/hl/ServiceHero";
import { photoFile } from "@/lib/photo-files";
import type { serviceHeroDefinition } from "./definition";

export function ServiceHeroBlock({ content, primary }: BlockProps<ContentOf<typeof serviceHeroDefinition.fields>>) {
  const { width, height, small } = photoFile(content.photo.src);
  return (
    <ServiceHero
      title={content.title}
      intro={content.intro}
      overview={content.overview}
      photo={{ src: content.photo.src, alt: content.photo.alt, width, height }}
      small={small}
      drawing={content.drawing}
      headingLevel={primary ? "h1" : "h2"}
    />
  );
}
