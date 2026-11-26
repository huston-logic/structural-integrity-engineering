import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const splitFaqDefinition = defineBlock({
  type: "split-faq",
  title: "Questions beside a heading",
  description: "A heading in a narrow left column with questions that open to show their answers beside it.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    items: {
      kind: "list",
      label: "Questions",
      min: 1,
      max: 12,
      of: {
        kind: "object",
        label: "Question",
        fields: {
          question: { kind: "text", label: "Question", max: 140 },
          answer: { kind: "text", label: "Answer", max: 500 },
        },
      },
    },
  },
  variants: [{ name: "default", description: "Questions open and close one by one; works without JavaScript." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "Glazing questions",
    items: [
      { question: "What do you need to start?", answer: "System type, elevations and spans, project location or design pressures, and any specified deflection limits." },
      { question: "Do you stamp drawings?", answer: "We stamp calculations and drawings in Colorado. For other states, we'll arrange licensure on request." },
    ],
  },
});
