// The components for this site's own blocks, keyed by block type. See README.md in this folder.
import type { BlockComponent } from "@/blocks/types";
import { ConditionsBlock } from "./conditions/ConditionsBlock";
import { ContactBandBlock } from "./contact-band/ContactBandBlock";
import { ContactHeroFormBlock } from "./contact-hero-form/ContactHeroFormBlock";
import { FiguresAndReasonsBlock } from "./figures-and-reasons/FiguresAndReasonsBlock";
import { HomeHeroBlock } from "./home-hero/HomeHeroBlock";
import { HowWeWorkBlock } from "./how-we-work/HowWeWorkBlock";
import { HowWeWorkTeaserBlock } from "./how-we-work-teaser/HowWeWorkTeaserBlock";
import { PageHeroBlock } from "./page-hero/PageHeroBlock";
import { PhotoHeroBlock } from "./photo-hero/PhotoHeroBlock";
import { PolicySectionsBlock } from "./policy-sections/PolicySectionsBlock";
import { ProfileBlock } from "./profile/ProfileBlock";
import { ServiceCardsBlock } from "./service-cards/ServiceCardsBlock";
import { ServiceChoicesBlock } from "./service-choices/ServiceChoicesBlock";
import { ServiceHeroBlock } from "./service-hero/ServiceHeroBlock";
import { SplitFaqBlock } from "./split-faq/SplitFaqBlock";
import { SplitListBlock } from "./split-list/SplitListBlock";
import { SplitTextBlock } from "./split-text/SplitTextBlock";
import { StandardAndMissionBlock } from "./standard-and-mission/StandardAndMissionBlock";
import { StatementBlock } from "./statement/StatementBlock";
import { WhatWeDoBlock } from "./what-we-do/WhatWeDoBlock";

export const siteBlockComponents: Record<string, BlockComponent> = {
  "home-hero": HomeHeroBlock,
  "photo-hero": PhotoHeroBlock,
  "service-hero": ServiceHeroBlock,
  "page-hero": PageHeroBlock,
  "contact-hero-form": ContactHeroFormBlock,
  conditions: ConditionsBlock,
  "service-cards": ServiceCardsBlock,
  "service-choices": ServiceChoicesBlock,
  "figures-and-reasons": FiguresAndReasonsBlock,
  "split-list": SplitListBlock,
  "split-text": SplitTextBlock,
  "how-we-work": HowWeWorkBlock,
  "split-faq": SplitFaqBlock,
  "what-we-do": WhatWeDoBlock,
  "how-we-work-teaser": HowWeWorkTeaserBlock,
  statement: StatementBlock,
  profile: ProfileBlock,
  "standard-and-mission": StandardAndMissionBlock,
  "policy-sections": PolicySectionsBlock,
  "contact-band": ContactBandBlock,
};
