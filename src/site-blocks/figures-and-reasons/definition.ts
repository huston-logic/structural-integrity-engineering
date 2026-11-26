import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const figuresAndReasonsDefinition = defineBlock({
  type: "figures-and-reasons",
  title: "Figures and reasons",
  description: "One deep band: big amber figures that count up as they scroll into view, then a heading and a grid of short reasons.",
  source: "site",
  fields: {
    figures: {
      kind: "list",
      label: "Figures",
      min: 2,
      max: 3,
      of: {
        kind: "object",
        label: "Figure",
        fields: {
          value: { kind: "text", label: "Number", max: 4, help: "Digits only, such as 48. It counts up from 0 on screen; the real number is always in the page." },
          unit: { kind: "text", label: "Word beside the number", max: 20 },
          body: { kind: "text", label: "Line under the number", max: 120 },
        },
      },
    },
    heading: { kind: "text", label: "Heading above the reasons", max: 60 },
    items: {
      kind: "list",
      label: "Reasons",
      min: 2,
      max: 6,
      of: {
        kind: "object",
        label: "Reason",
        fields: {
          title: { kind: "text", label: "Title", max: 40 },
          body: { kind: "text", label: "Text", max: 200 },
        },
      },
    },
  },
  variants: [{ name: "default", description: "Figures in columns from 900 px wide; reasons in two columns with fading dividers, no boxes." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    figures: [
      { value: "48", unit: "hours", body: "to a clear proposal with deliverables, pricing and schedule" },
      { value: "10", unit: "years", body: "of hands-on structural engineering" },
    ],
    heading: "Why builders call us back",
    items: [
      { title: "Fast and responsive", body: "Questions don't sit unanswered. We respond to RFIs quickly to keep the project moving." },
      { title: "Permit-ready packages", body: "Clear drawings and stamped calculations that satisfy the submittal requirements." },
    ],
  },
});
