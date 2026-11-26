import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const statementDefinition = defineBlock({
  type: "statement",
  title: "Statement",
  description: "One large paragraph on a deep band: a single statement of what the practice is.",
  source: "site",
  fields: {
    text: { kind: "text", label: "Statement", max: 500 },
  },
  variants: [{ name: "default", description: "Large text in a narrow column." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    text: "Structural Integrity Engineering is a structural engineering practice specializing in custom residential design, low-rise commercial projects and glazing and mullion engineering.",
  },
});
