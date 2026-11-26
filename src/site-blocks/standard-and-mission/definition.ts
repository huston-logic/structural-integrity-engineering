import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const standardAndMissionDefinition = defineBlock({
  type: "standard-and-mission",
  title: "Standard and mission",
  description: "One deep band: a heading over a wide photo with a line of licensing under it, then a divider and the mission.",
  source: "site",
  fields: {
    standard: {
      kind: "object",
      label: "Standard",
      fields: {
        heading: { kind: "text", label: "Heading", max: 40 },
        line: { kind: "text", label: "Line under the photo", max: 100 },
        photo: { kind: "image", shape: "3:2", label: "Wide photo", help: "A 3:2 photo. A new photo needs a line in src/content/photos.ts." },
      },
    },
    mission: {
      kind: "object",
      label: "Mission",
      fields: {
        heading: { kind: "text", label: "Heading", max: 40 },
        body: { kind: "text", label: "Paragraph", max: 300 },
      },
    },
  },
  variants: [{ name: "default", description: "The photo eases in as it crosses the screen." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    standard: {
      heading: "One standard",
      line: "Licensed in Colorado and Alaska.",
      photo: {
        src: "/images/colorado-pikes-peak.jpg",
        alt: "A snow-dusted mountain rising above a line of evergreen trees under a pale blue sky.",
      },
    },
    mission: {
      heading: "Our mission",
      body: "To ensure the integrity and performance of every structure we design, combining technical excellence with practical efficiency.",
    },
  },
});
