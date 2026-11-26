import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const contactHeroFormDefinition = defineBlock({
  type: "contact-hero-form",
  title: "Contact page",
  description: "The whole contact page: the headline and a line with the direct email and phone, and the six-field form beside them. The form is wired to the site's own settings.",
  source: "site",
  fields: {
    title: { kind: "text", label: "Headline", max: 40, help: "The page's one main heading." },
    intro: { kind: "text", label: "Line under the headline", max: 240 },
  },
  variants: [{ name: "default", description: "From 900 px wide the text stays in the left column while the form fills the right; on phones they stack." }],
  placement: { position: "first", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    title: "Let's get in touch.",
    intro: "We're here to help you move forward with clarity and confidence. Send us your plans or questions and we'll respond as fast as we can.",
  },
});
