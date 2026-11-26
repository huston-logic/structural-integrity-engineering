import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { HomeHero } from "@/components/hl/HomeHero";
import { photoFile } from "@/lib/photo-files";
import type { homeHeroDefinition } from "./definition";

export function HomeHeroBlock({ content, headingId, primary }: BlockProps<ContentOf<typeof homeHeroDefinition.fields>>) {
  const { width, height, small, phone } = photoFile(content.photo.src);
  return (
    <HomeHero
      title={content.title}
      intro={content.intro}
      action={content.action}
      photo={{ src: content.photo.src, alt: content.photo.alt, width, height }}
      small={small}
      phone={phone}
      labels={content.labels}
      headingLevel={primary ? "h1" : "h2"}
      headingId={headingId}
    />
  );
}
