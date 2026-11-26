import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const policySectionsDefinition = defineBlock({
  type: "policy-sections",
  title: "Policy sections",
  description: "Plain headed sections of text in a narrow reading column, then a closing line such as the date the policy was last updated.",
  source: "site",
  fields: {
    sections: {
      kind: "list",
      label: "Sections",
      min: 1,
      max: 14,
      of: {
        kind: "object",
        label: "Section",
        fields: {
          heading: { kind: "text", label: "Heading", max: 60 },
          body: { kind: "text", label: "Text", max: 900 },
        },
      },
    },
    footnote: { kind: "text", label: "Closing line", max: 120, required: false },
  },
  variants: [{ name: "default", description: "One column, about 64 characters wide." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    sections: [
      { heading: "How we use it", body: "To answer your request and work with you on your project. We do not sell it, and we do not use it for advertising." },
      { heading: "How long we keep it", body: "For as long as we need it to answer you and work on your project." },
    ],
    footnote: "Last updated November 24, 2026.",
  },
});
