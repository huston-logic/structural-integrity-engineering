import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { WhatWeDo } from "@/components/hl/WhatWeDo";
import { photoFile } from "@/lib/photo-files";
import type { whatWeDoDefinition } from "./definition";

export function WhatWeDoBlock({ content, headingId }: BlockProps<ContentOf<typeof whatWeDoDefinition.fields>>) {
  const photos = content.photos.map((photo) => {
    const { width, height } = photoFile(photo.src);
    return { src: photo.src, alt: photo.alt, width, height };
  });
  return <WhatWeDo heading={content.heading} items={content.items} photos={photos} headingId={headingId} />;
}
