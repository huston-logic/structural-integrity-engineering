import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const photoHeroDefinition = defineBlock({
  type: "photo-hero",
  title: "Photo hero",
  description: "A page top with the headline and a line on the left and a photo on the right that carries the page's amber line drawing.",
  source: "site",
  fields: {
    title: { kind: "text", label: "Headline", max: 60, help: "The page's one main heading." },
    intro: { kind: "text", label: "Line under the headline", max: 200 },
    photo: { kind: "image", shape: "3:2", label: "Photo", help: "A new photo needs a line in src/content/photos.ts." },
    drawing: { kind: "choice", label: "Line drawing", options: ["services"] },
  },
  variants: [{ name: "default", description: "Text and photo side by side from 1024 px wide, stacked on phones." }],
  placement: { position: "first", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    title: "Structural engineering services",
    intro: "Fast, accurate, permit-ready plans for homes, low-rise commercial buildings and glazing systems.",
    photo: {
      src: "/images/engineer-plans.jpg",
      alt: "An engineer in a hard hat points at a floor plan pinned to a concrete column inside an unfinished building.",
    },
    drawing: "services",
  },
});
