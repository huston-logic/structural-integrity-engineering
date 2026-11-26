import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { Faq } from "@/components/hl/Faq";
import { SplitSection } from "@/components/hl/SplitSection";
import { Text } from "@/components/ui/Text";
import type { splitFaqDefinition } from "./definition";

export function SplitFaqBlock({ content, headingId }: BlockProps<ContentOf<typeof splitFaqDefinition.fields>>) {
  return (
    <SplitSection id={headingId} tone="deep" heading={<Text>{content.heading}</Text>}>
      <div className="max-w-faq lg:-mt-3">
        <Faq items={content.items} />
      </div>
    </SplitSection>
  );
}
