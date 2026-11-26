// Every block the site knows: the template's library followed by this site's own. Relative .ts imports only, so Node
// scripts (the content check, the catalog) can load it.
import { siteBlocks } from "../site-blocks/definitions.ts";
import { closingCtaDefinition } from "./library/closing-cta/definition.ts";
import { contactFormDefinition } from "./library/contact-form/definition.ts";
import { faqDefinition } from "./library/faq/definition.ts";
import { galleryDefinition } from "./library/gallery/definition.ts";
import { heroDefinition } from "./library/hero/definition.ts";
import { highlightsDefinition } from "./library/highlights/definition.ts";
import { legalSectionsDefinition } from "./library/legal-sections/definition.ts";
import { photoTextDefinition } from "./library/photo-text/definition.ts";
import { proseDefinition } from "./library/prose/definition.ts";
import { stepsDefinition } from "./library/steps/definition.ts";
import { videoDefinition } from "./library/video/definition.ts";
import { videoGridDefinition } from "./library/video-grid/definition.ts";
import type { AnyBlockDefinition } from "./schema.ts";

export const libraryBlocks: AnyBlockDefinition[] = [
  heroDefinition,
  highlightsDefinition,
  proseDefinition,
  faqDefinition,
  closingCtaDefinition,
  contactFormDefinition,
  stepsDefinition,
  legalSectionsDefinition,
  videoDefinition,
  videoGridDefinition,
  photoTextDefinition,
  galleryDefinition,
];

export const registry: AnyBlockDefinition[] = [...libraryBlocks, ...siteBlocks];
