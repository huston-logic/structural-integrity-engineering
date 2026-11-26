import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const conditionsDefinition = defineBlock({
  type: "conditions",
  title: "Design conditions",
  description: "A deep band with a heading and a line, then up to six short items in columns, each under a rule with its own amber glyph.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    intro: { kind: "text", label: "Line beside the heading", max: 200 },
    items: {
      kind: "list",
      label: "Conditions",
      min: 2,
      max: 6,
      of: {
        kind: "object",
        label: "Condition",
        fields: {
          glyph: { kind: "choice", label: "Glyph", options: ["snow", "wind", "seismic", "temperature"], help: "The amber line picture drawn above the title." },
          title: { kind: "text", label: "Title", max: 40 },
          body: { kind: "text", label: "Text", max: 140 },
        },
      },
    },
  },
  variants: [{ name: "default", description: "Four columns from 900 px wide (two on phones); each item rises into view." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "Built for every condition",
    intro: "In Colorado, our experience with cold climates, wind and seismic conditions means every project is built to last.",
    items: [
      { glyph: "snow", title: "Heavy snow", body: "Roof framing, beams and connections sized for heavy snow loads." },
      { glyph: "wind", title: "High wind", body: "Lateral systems and uplift connections checked against the wind at your site." },
      { glyph: "seismic", title: "Seismic activity", body: "Shear walls, hold-downs and foundations that work together when the ground moves." },
      { glyph: "temperature", title: "Temperature swings", body: "Details that allow for movement through extreme temperature shifts." },
    ],
  },
});
