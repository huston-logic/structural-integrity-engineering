import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const serviceHeroDefinition = defineBlock({
  type: "service-hero",
  title: "Service page hero",
  description: "The top of a service page: the headline and a line, the overview paragraph, and a hero photo that carries the page's amber line drawing.",
  source: "site",
  fields: {
    title: { kind: "text", label: "Headline", max: 50, help: "The page's one main heading." },
    intro: { kind: "text", label: "Line under the headline", max: 200 },
    overview: { kind: "text", label: "Overview paragraph", max: 500 },
    photo: { kind: "image", shape: "3:2", label: "Hero photo", help: "A 3:2 photo. A new photo needs a line in src/content/photos.ts." },
    drawing: { kind: "choice", label: "Line drawing", options: ["residential", "commercial", "glazing"] },
  },
  variants: [{ name: "default", description: "Phones: headline, photo, overview. From 1024 px wide: text on the left, photo beside it." }],
  placement: { position: "first", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    title: "Residential structural design",
    intro: "Permit-ready plans for custom homes, remodels, additions, decks and foundations. Fast, accurate and affordable.",
    overview:
      "We engineer residential structures to pass plan check and build cleanly in the field. From removing a load-bearing wall to a new custom home, the goal is simple: move your project forward quickly and correctly.",
    photo: {
      src: "/images/framing-wood-900.jpg",
      alt: "Looking up at a wood roof frame of rafters and beams against a blue sky with clouds.",
    },
    drawing: "residential",
  },
});
