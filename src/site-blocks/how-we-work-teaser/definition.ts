import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const howWeWorkTeaserDefinition = defineBlock({
  type: "how-we-work-teaser",
  title: "How we work, short",
  description: "A heading that links to the full steps, with the first step written out beside it.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading (a link)", max: 40 },
    href: { kind: "link", label: "Page the heading opens" },
    stepTitle: { kind: "text", label: "Step title", max: 50 },
    stepBody: { kind: "text", label: "Step text", max: 300 },
  },
  variants: [{ name: "default", description: "A compact deep band; the heading stacks above the step on phones." }],
  placement: { position: "any", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "How we work",
    href: "/services",
    stepTitle: "Share your plans",
    stepBody: "Send drawings, sketches or site photos. We review the scope, ask the right questions and outline what a permit-ready package needs.",
  },
});
