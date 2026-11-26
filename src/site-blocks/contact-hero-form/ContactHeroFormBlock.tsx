import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { ContactForm } from "@/components/hl/ContactForm";
import { ContactHero } from "@/components/hl/ContactHero";
import type { contactHeroFormDefinition } from "./definition";

export function ContactHeroFormBlock({ content, primary }: BlockProps<ContentOf<typeof contactHeroFormDefinition.fields>>) {
  return (
    <ContactHero title={content.title} intro={content.intro} headingLevel={primary ? "h1" : "h2"}>
      <ContactForm />
    </ContactHero>
  );
}
