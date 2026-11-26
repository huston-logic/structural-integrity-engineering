import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { StandardAndMission } from "@/components/hl/StandardAndMission";
import { photoWithAlt } from "@/lib/photo-files";
import type { standardAndMissionDefinition } from "./definition";

export function StandardAndMissionBlock({ content, headingId }: BlockProps<ContentOf<typeof standardAndMissionDefinition.fields>>) {
  const standard = { heading: content.standard.heading, line: content.standard.line, photo: photoWithAlt(content.standard.photo) };
  return <StandardAndMission standard={standard} mission={content.mission} headingId={headingId} />;
}
