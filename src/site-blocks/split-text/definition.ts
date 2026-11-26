import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const splitTextDefinition = defineBlock({
  type: "split-text",
  title: "Heading and paragraph",
  description: "A heading in a narrow left column with one paragraph beside it, on the deeper band color.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 40 },
    body: { kind: "text", label: "Paragraph", max: 700 },
  },
  variants: [{ name: "default", description: "A compact deep band; the heading stacks above the paragraph on phones." }],
  placement: { position: "any", maxPerPage: 2, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "Tools and codes",
    body: "All work is produced in AutoCAD and Revit for clean coordination with architects and general contractors. We design to IBC and ASCE 7 loads, as the project and jurisdiction require.",
  },
});
