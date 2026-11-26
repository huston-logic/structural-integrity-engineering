import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { ContactForm } from "@/components/hl/ContactForm";
import { ContactHero } from "@/components/hl/ContactHero";
import { noteForm } from "@/content/contact";
import type { contactHeroFormDefinition } from "./definition";

export function ContactHeroFormBlock({ content, primary }: BlockProps<ContentOf<typeof contactHeroFormDefinition.fields>>) {
  return (
    <ContactHero title={content.title} intro={content.intro} headingLevel={primary ? "h1" : "h2"}>
      {/* On the showcase page a second form sits beside the library's, so the example names itself and uses its own ids. */}
      {primary ? (
        <ContactForm />
      ) : (
        <ContactForm name={`${noteForm.formLabel} (${content.title})`} idPrefix="cf-example" />
      )}
    </ContactHero>
  );
}
