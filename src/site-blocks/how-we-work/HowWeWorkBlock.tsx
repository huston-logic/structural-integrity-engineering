import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { HowWeWork } from "@/components/hl/HowWeWork";
import type { howWeWorkDefinition } from "./definition";

export function HowWeWorkBlock({ content, headingId }: BlockProps<ContentOf<typeof howWeWorkDefinition.fields>>) {
  return <HowWeWork heading={content.heading} steps={content.steps} where={content.where} headingId={headingId} />;
}
