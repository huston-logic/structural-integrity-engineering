import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { DotList } from "@/components/hl/DotList";
import { SplitSection } from "@/components/hl/SplitSection";
import { Text } from "@/components/ui/Text";
import type { splitListDefinition } from "./definition";

export function SplitListBlock({ content, variant, headingId }: BlockProps<ContentOf<typeof splitListDefinition.fields>>) {
  return (
    <SplitSection id={headingId} tone={variant === "deep" ? "deep" : "dusk"} heading={<Text>{content.heading}</Text>}>
      <DotList items={content.items} className="max-w-em-40 space-y-5 text-body" />
    </SplitSection>
  );
}
