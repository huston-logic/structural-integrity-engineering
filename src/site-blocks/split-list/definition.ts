import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const splitListDefinition = defineBlock({
  type: "split-list",
  title: "Heading and dot list",
  description: "A heading in a narrow left column with a list of short points beside it, each with an amber dot.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 40 },
    items: {
      kind: "list",
      label: "Points",
      min: 1,
      max: 10,
      of: { kind: "text", label: "Point", max: 240 },
    },
  },
  variants: [
    { name: "dusk", description: "On the page's dusk color." },
    { name: "deep", description: "On the deeper band color." },
  ],
  placement: { position: "any", maxPerPage: 3, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "Who we serve",
    items: [
      "Architects looking for coordinated structural sets that fit the design intent.",
      "Homeowners who need reliable engineering for remodels, additions or new homes.",
      "Builders and contractors who value quick responses, clear drawings and practical field solutions.",
    ],
  },
});
