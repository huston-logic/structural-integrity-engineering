// This site's own blocks. See README.md in this folder. The template ships this list empty and never changes it, so a
// template update leaves the site's blocks alone.
import type { AnyBlockDefinition } from "../blocks/schema.ts";
import { conditionsDefinition } from "./conditions/definition.ts";
import { contactBandDefinition } from "./contact-band/definition.ts";
import { contactHeroFormDefinition } from "./contact-hero-form/definition.ts";
import { figuresAndReasonsDefinition } from "./figures-and-reasons/definition.ts";
import { homeHeroDefinition } from "./home-hero/definition.ts";
import { howWeWorkDefinition } from "./how-we-work/definition.ts";
import { howWeWorkTeaserDefinition } from "./how-we-work-teaser/definition.ts";
import { pageHeroDefinition } from "./page-hero/definition.ts";
import { photoHeroDefinition } from "./photo-hero/definition.ts";
import { policySectionsDefinition } from "./policy-sections/definition.ts";
import { profileDefinition } from "./profile/definition.ts";
import { serviceCardsDefinition } from "./service-cards/definition.ts";
import { serviceChoicesDefinition } from "./service-choices/definition.ts";
import { serviceHeroDefinition } from "./service-hero/definition.ts";
import { splitFaqDefinition } from "./split-faq/definition.ts";
import { splitListDefinition } from "./split-list/definition.ts";
import { splitTextDefinition } from "./split-text/definition.ts";
import { standardAndMissionDefinition } from "./standard-and-mission/definition.ts";
import { statementDefinition } from "./statement/definition.ts";
import { whatWeDoDefinition } from "./what-we-do/definition.ts";

export const siteBlocks: AnyBlockDefinition[] = [
  homeHeroDefinition,
  photoHeroDefinition,
  serviceHeroDefinition,
  pageHeroDefinition,
  contactHeroFormDefinition,
  conditionsDefinition,
  serviceCardsDefinition,
  serviceChoicesDefinition,
  figuresAndReasonsDefinition,
  splitListDefinition,
  splitTextDefinition,
  howWeWorkDefinition,
  splitFaqDefinition,
  whatWeDoDefinition,
  howWeWorkTeaserDefinition,
  statementDefinition,
  profileDefinition,
  standardAndMissionDefinition,
  policySectionsDefinition,
  contactBandDefinition,
];
