import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { SplitSection } from "@/components/hl/SplitSection";
import { Text } from "@/components/ui/Text";
import type { splitTextDefinition } from "./definition";

export function SplitTextBlock({ content, headingId }: BlockProps<ContentOf<typeof splitTextDefinition.fields>>) {
  return (
    <SplitSection id={headingId} tone="deep" spacing="compact" heading={<Text>{content.heading}</Text>}>
      <p className="max-w-em-40 text-body text-mist">
        <Text>{content.body}</Text>
      </p>
    </SplitSection>
  );
}
