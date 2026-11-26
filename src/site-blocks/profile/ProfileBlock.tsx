import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { Profile } from "@/components/hl/Profile";
import { photoWithAlt } from "@/lib/photo-files";
import type { profileDefinition } from "./definition";

export function ProfileBlock({ content, headingId }: BlockProps<ContentOf<typeof profileDefinition.fields>>) {
  return <Profile heading={content.heading} body={content.body} photo={photoWithAlt(content.photo)} headingId={headingId} />;
}
