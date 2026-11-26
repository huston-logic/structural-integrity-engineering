import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { PageHero } from "@/components/hl/PageHero";
import type { pageHeroDefinition } from "./definition";

export function PageHeroBlock({ content, primary }: BlockProps<ContentOf<typeof pageHeroDefinition.fields>>) {
  return <PageHero title={content.title} intro={content.intro} drawing={content.drawing} headingLevel={primary ? "h1" : "h2"} />;
}
