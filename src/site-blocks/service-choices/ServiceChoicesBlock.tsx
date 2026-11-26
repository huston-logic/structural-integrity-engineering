import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { resolveHref } from "@/blocks/links";
import { ServiceChoices } from "@/components/hl/ServiceChoices";
import { photoFile } from "@/lib/photo-files";
import type { serviceChoicesDefinition } from "./definition";

export function ServiceChoicesBlock({ content, headingId }: BlockProps<ContentOf<typeof serviceChoicesDefinition.fields>>) {
  const items = content.items.map((item) => {
    const { width, height } = photoFile(item.photo);
    return { title: item.title, body: item.body, href: resolveHref(item.href), photo: { src: item.photo, width, height } };
  });
  return <ServiceChoices heading={content.heading} items={items} headingId={headingId} />;
}
