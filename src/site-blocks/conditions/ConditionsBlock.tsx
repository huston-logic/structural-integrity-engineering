import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { ConditionList } from "@/components/hl/ConditionList";
import { Section } from "@/components/hl/Section";
import { SectionIntro } from "@/components/hl/SectionIntro";
import type { conditionsDefinition } from "./definition";

export function ConditionsBlock({ content, headingId }: BlockProps<ContentOf<typeof conditionsDefinition.fields>>) {
  return (
    <Section tone="deep" labelledBy={headingId}>
      <SectionIntro id={headingId} heading={content.heading} intro={content.intro} />
      <ConditionList items={content.items} />
    </Section>
  );
}
