import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { PolicySections } from "@/components/hl/PolicySections";
import type { policySectionsDefinition } from "./definition";

export function PolicySectionsBlock({ content }: BlockProps<ContentOf<typeof policySectionsDefinition.fields>>) {
  return <PolicySections sections={content.sections} footnote={content.footnote} />;
}
