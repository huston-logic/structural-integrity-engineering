import { siteBlockComponents } from "@/site-blocks/components";
import { ClosingCtaBlock } from "./library/closing-cta/ClosingCtaBlock";
import { ContactFormBlock } from "./library/contact-form/ContactFormBlock";
import { FaqBlock } from "./library/faq/FaqBlock";
import { GalleryBlock } from "./library/gallery/GalleryBlock";
import { HeroBlock } from "./library/hero/HeroBlock";
import { HighlightsBlock } from "./library/highlights/HighlightsBlock";
import { LegalSectionsBlock } from "./library/legal-sections/LegalSectionsBlock";
import { PhotoTextBlock } from "./library/photo-text/PhotoTextBlock";
import { ProseBlock } from "./library/prose/ProseBlock";
import { StepsBlock } from "./library/steps/StepsBlock";
import { VideoBlock } from "./library/video/VideoBlock";
import { VideoGridBlock } from "./library/video-grid/VideoGridBlock";
import type { BlockComponent } from "./types";

export type { BlockComponent, BlockProps } from "./types";

/** Block type to component: the library's, then this site's own. */
export const blockComponents: Record<string, BlockComponent> = {
  hero: HeroBlock,
  highlights: HighlightsBlock,
  prose: ProseBlock,
  faq: FaqBlock,
  "closing-cta": ClosingCtaBlock,
  "contact-form": ContactFormBlock,
  steps: StepsBlock,
  "legal-sections": LegalSectionsBlock,
  video: VideoBlock,
  "video-grid": VideoGridBlock,
  "photo-text": PhotoTextBlock,
  gallery: GalleryBlock,
  ...siteBlockComponents,
};
