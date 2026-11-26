import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const howWeWorkDefinition = defineBlock({
  type: "how-we-work",
  title: "Numbered steps",
  description: "A heading and a numbered list of steps in two columns, then a second heading with a paragraph under a divider.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 40 },
    steps: {
      kind: "list",
      label: "Steps",
      min: 2,
      max: 8,
      of: {
        kind: "object",
        label: "Step",
        fields: {
          title: { kind: "text", label: "Title", max: 50 },
          body: { kind: "text", label: "Text", max: 240 },
        },
      },
    },
    where: {
      kind: "object",
      label: "Closing note under the steps",
      fields: {
        heading: { kind: "text", label: "Heading", max: 40 },
        body: { kind: "text", label: "Paragraph", max: 320 },
      },
    },
  },
  variants: [{ name: "default", description: "Steps in two columns with fading dividers; the number is amber." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "How we work",
    steps: [
      { title: "Share your plans", body: "Send drawings, sketches or site photos. We review the scope and ask the right questions." },
      { title: "Scope and quote in 48 hours", body: "Within two business days you get a clear proposal with deliverables, pricing and schedule." },
    ],
    where: { heading: "Where we work", body: "Currently serving Colorado. Need help in another state? We'll get licensed quickly and handle local requirements." },
  },
});
