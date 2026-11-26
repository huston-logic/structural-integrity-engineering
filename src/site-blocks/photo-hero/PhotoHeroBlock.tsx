import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { PhotoHero } from "@/components/hl/PhotoHero";
import { photoFile } from "@/lib/photo-files";
import type { photoHeroDefinition } from "./definition";

export function PhotoHeroBlock({ content, primary }: BlockProps<ContentOf<typeof photoHeroDefinition.fields>>) {
  const { width, height, small } = photoFile(content.photo.src);
  return (
    <PhotoHero
      title={content.title}
      intro={content.intro}
      photo={{ src: content.photo.src, alt: content.photo.alt, width, height }}
      small={small}
      drawing={content.drawing}
      headingLevel={primary ? "h1" : "h2"}
    />
  );
}
