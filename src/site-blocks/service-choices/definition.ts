import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const serviceChoicesDefinition = defineBlock({
  type: "service-choices",
  title: "Service choices",
  description: "A deep band with a heading and up to six linked cards, each a photo, a title and a short text.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    items: {
      kind: "list",
      label: "Choices",
      min: 2,
      max: 6,
      of: {
        kind: "object",
        label: "Choice",
        fields: {
          title: { kind: "text", label: "Title", max: 50 },
          body: { kind: "text", label: "Text", max: 200 },
          href: { kind: "link", label: "Page the card opens" },
          photo: { kind: "text", label: "Photo file", max: 120, help: "A path under /images/, such as /images/chalet-snow-640.jpg. Decoration beside the title, so it has no alt text. A new photo needs a line in src/content/photos.ts." },
        },
      },
    },
  },
  variants: [{ name: "default", description: "Three columns from 768 px wide; the photos ease in as they cross the screen." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "Choose your service",
    items: [
      {
        title: "Residential structural design",
        body: "Custom homes, remodels and additions, decks, foundations, retaining walls, lateral checks.",
        href: "/services/residential-structural-design",
        photo: "/images/chalet-snow-640.jpg",
      },
      {
        title: "Low-rise commercial",
        body: "Small retail and office, tenant improvement scopes, framing and lateral design, connection details, permit coordination.",
        href: "/services/low-rise-commercial-structural-design",
        photo: "/images/commercial-crane-640.jpg",
      },
      {
        title: "Glazing and mullion engineering",
        body: "Storefronts, mullion spans and deflection, anchorage, thermal movement; shop drawings and calculations.",
        href: "/services/glazing-and-mullion-engineering",
        photo: "/images/curtain-wall-640.jpg",
      },
    ],
  },
});
