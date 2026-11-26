import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const serviceCardsDefinition = defineBlock({
  type: "service-cards",
  title: "Photo cards",
  description: "A heading with a line beside it, then up to six cards: a tall photo, a title that links to a page and a short text.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    intro: { kind: "text", label: "Line beside the heading", max: 240 },
    items: {
      kind: "list",
      label: "Cards",
      min: 2,
      max: 6,
      of: {
        kind: "object",
        label: "Card",
        fields: {
          title: { kind: "text", label: "Title", max: 40 },
          body: { kind: "text", label: "Text", max: 220 },
          href: { kind: "link", label: "Page the card opens" },
          photo: { kind: "image", shape: "4:5", label: "Photo", help: "A 4:5 crop. A new photo needs a line in src/content/photos.ts." },
        },
      },
    },
  },
  variants: [{ name: "default", description: "Three columns from 900 px wide; the whole card is the link. The photos ease in as they cross the screen." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "What we design",
    intro: "We partner with architects, builders and homeowners to keep projects moving with clear drawings, responsive communication and clean calculations.",
    items: [
      {
        title: "Residential",
        body: "Structural and foundation designs for custom homes, master plans, remodels, additions and decks, tailored for permitting and construction.",
        href: "/services/residential-structural-design",
        photo: { src: "/images/chalet-snow-card.jpg", alt: "A stone and log house with a car parked at the end of a deep snow drift in the driveway." },
      },
      {
        title: "Low-rise commercial",
        body: "Structural and foundation designs for retail, office and tenant improvements, tailored for permitting and construction.",
        href: "/services/low-rise-commercial-structural-design",
        photo: {
          src: "/images/commercial-crane-card.jpg",
          alt: "A multi-story wood-framed building under construction, wrapped in house wrap, with a yellow tower crane above it.",
        },
      },
      {
        title: "Glazing and mullion",
        body: "Redlines and structural calculations for glazing, mullion, facade, storefront, curtainwall and sunshade systems.",
        href: "/services/glazing-and-mullion-engineering",
        photo: {
          src: "/images/curtain-wall-card.jpg",
          alt: "Looking up at the glass curtain wall of a tall building, with the sky and clouds reflected in the panels.",
        },
      },
    ],
  },
});
