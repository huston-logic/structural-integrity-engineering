import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const pageHeroDefinition = defineBlock({
  type: "page-hero",
  title: "Page hero",
  description: "A plain page top on dusk: the headline and a line, with an amber line drawing beside them if the page has one.",
  source: "site",
  fields: {
    title: { kind: "text", label: "Headline", max: 60, help: "The page's one main heading." },
    intro: { kind: "text", label: "Line under the headline", max: 240, required: false },
    drawing: { kind: "choice", label: "Line drawing", options: ["about"], required: false, help: "Leave out for a page with no drawing." },
  },
  variants: [{ name: "default", description: "Left-aligned text; the drawing sits under it on phones and beside it from 1024 px wide." }],
  placement: { position: "first", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    title: "Structural design, simplified.",
    intro: "Responsive communication, modern tools and permit-ready plans you can build on.",
    drawing: "about",
  },
});
