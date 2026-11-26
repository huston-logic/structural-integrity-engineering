import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const homeHeroDefinition = defineBlock({
  type: "home-hero",
  title: "Home hero",
  description: "The home page's first screen: a centered headline, a line under it and a button, in the sky of a dusk photo with an amber line drawing on the house.",
  source: "site",
  fields: {
    title: { kind: "text", label: "Headline", max: 60, help: "The page's one main heading." },
    intro: { kind: "text", label: "Line under the headline", max: 200 },
    action: { kind: "action", label: "Button", labelMax: 30 },
    photo: { kind: "image", label: "Photo", help: "The dusk house photo. The line drawing is drawn for this picture, so keep it." },
    labels: {
      kind: "object",
      label: "Labels on the drawing",
      fields: {
        cantilever: { kind: "text", label: "Cantilever", max: 24 },
        clearSpan: { kind: "text", label: "Clear span", max: 24 },
        wind: { kind: "text", label: "Wind", max: 24 },
      },
    },
  },
  variants: [{ name: "default", description: "Centered text over the photo's sky; the line drawing draws itself, then holds still." }],
  placement: { position: "first", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    title: "Strength you can build on.",
    intro: "Structural engineering for homes, low-rise commercial buildings and glazing systems in Colorado.",
    action: { label: "Request a quote", href: "/contact-us" },
    photo: {
      src: "/images/dusk-home.jpg",
      alt: "A modern two-story house with a white upper floor, wood soffits and glass walls, lit from inside at dusk above a snowy slope.",
    },
    labels: { cantilever: "Cantilever", clearSpan: "Clear span", wind: "Wind" },
  },
});
