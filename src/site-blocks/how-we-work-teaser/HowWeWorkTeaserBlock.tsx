import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { resolveHref } from "@/blocks/links";
import { HowWeWorkTeaser } from "@/components/hl/HowWeWorkTeaser";
import type { howWeWorkTeaserDefinition } from "./definition";

export function HowWeWorkTeaserBlock({ content, headingId }: BlockProps<ContentOf<typeof howWeWorkTeaserDefinition.fields>>) {
  return <HowWeWorkTeaser heading={content.heading} href={resolveHref(content.href)} stepTitle={content.stepTitle} stepBody={content.stepBody} headingId={headingId} />;
}
