import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { ContactBand } from "@/components/hl/ContactBand";
import type { contactBandDefinition } from "./definition";

/** The band keeps its own heading id ("contact-band-title"), so the heading id the renderer offers is not used. */
export function ContactBandBlock({ content }: BlockProps<ContentOf<typeof contactBandDefinition.fields>>) {
  return <ContactBand heading={content.heading} body={content.body} action={content.action} />;
}
