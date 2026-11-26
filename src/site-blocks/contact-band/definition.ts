import { defineBlock } from "../../blocks/schema.ts";
import { ownReveals } from "../motion.ts";

export const contactBandDefinition = defineBlock({
  type: "contact-band",
  title: "Contact band",
  description: "The band that ends a page: a centered headline, a line, the Request a quote button, then the phone number and email from the site settings.",
  source: "site",
  fields: {
    heading: { kind: "text", label: "Heading", max: 60 },
    body: { kind: "text", label: "Line under the heading", max: 160 },
    action: { kind: "action", label: "Button", labelMax: 30 },
  },
  variants: [{ name: "default", description: "Centered on dusk. The photo behind it, if any, is set in src/content/shared.ts." }],
  placement: { position: "last", maxPerPage: 1, rhythm: "none" },
  motion: ownReveals,
  example: {
    heading: "Ready to get started?",
    body: "Quick replies, clean drawings, and fair pricing.",
    action: { label: "Request a quote", href: "/contact-us" },
  },
});
