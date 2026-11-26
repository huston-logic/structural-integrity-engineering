import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const whatWeDoDefinition = defineBlock({
  type: "what-we-do",
  title: "What we do",
  description: "A deep band with a heading and a ruled list of the work, each with an optional line of detail, and one or two photos beside it.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 40 },
    items: {
      kind: "list",
      label: "Work",
      min: 1,
      max: 10,
      of: {
        kind: "object",
        label: "Kind of work",
        fields: {
          title: { kind: "text", label: "Title", max: 70 },
          body: { kind: "text", label: "Detail", max: 200, required: false, help: "Leave out for a list of names alone; the titles then show larger." },
        },
      },
    },
    photos: {
      kind: "list",
      label: "Photos",
      min: 1,
      max: 2,
      of: {
        kind: "image",
        shape: "4:5",
        label: "Photo",
        help: "Two photos are trimmed to 4:5 each; a single photo shows at 4:3. A new photo needs a line in src/content/photos.ts.",
      },
    },
  },
  variants: [{ name: "default", description: "The list on the left, the photos staying in view beside it from 1024 px wide." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "What we do",
    items: [
      { title: "Custom and luxury homes", body: "Framing and lateral plans that work with the design; gravity, wind and seismic calculations." },
      { title: "Foundations", body: "Spread footings, drilled piers and caissons, micropiles, helical piers." },
    ],
    photos: [
      {
        src: "/images/remodel-framing-640.jpg",
        alt: "Wood wall studs in an interior under construction, with sheathing and a window opening visible behind them.",
      },
      {
        src: "/images/rebar-800.jpg",
        alt: "Steel reinforcing bars bent into a cage, seen from below against a pale sky beside a concrete wall.",
      },
    ],
  },
});
