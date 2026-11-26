import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const profileDefinition = defineBlock({
  type: "profile",
  title: "Profile",
  description: "A portrait photo beside a heading and a paragraph about a person.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    body: { kind: "text", label: "Paragraph", max: 600 },
    photo: { kind: "image", label: "Portrait", help: "A new photo needs a line in src/content/photos.ts." },
  },
  variants: [{ name: "default", description: "Photo on the left from 1024 px wide, above the text on phones." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "Meet our principal engineer",
    body: "Dylan Gassmann is the founder and principal engineer of Structural Integrity Engineering. Based in Colorado Springs, he brings a decade of hands-on experience in structural engineering for residential and commercial projects.",
    photo: {
      src: "/images/dylan-portrait.jpg",
      alt: "Portrait of Dylan Gassmann, principal engineer, smiling in front of a brick wall.",
    },
  },
});
