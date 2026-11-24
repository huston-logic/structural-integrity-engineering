import { photos, type Photo } from "./photos";

/**
 * The three service pages, verbatim from the copy deck ("Services pages"). Each hero line is split at its first sentence:
 * the H1 is the page name, the rest is the line under it. The deck gives no SEO title or description for these pages, so
 * they stay placeholders until task 11.
 */
export type ServicePageContent = {
  meta: { title: string; description: string };
  /** The page's single H1. */
  title: string;
  intro: string;
  /** Desktop hero and the smaller copy served to phones. */
  heroPhoto: Photo;
  heroPhotoSmall: Photo;
  overview: string;
  whatWeDo: {
    heading: string;
    items: readonly { title: string; body?: string }[];
    /** Small crops shown beside the list, in the deck's photo order. */
    photos: readonly Photo[];
  };
  whatYouGet: { heading: string; items: readonly string[] };
  /** The short How we work: step 1 of the six on /services. The glazing page has its own fixed wording. */
  howWeWork: { heading: string; stepTitle: string; stepBody: string };
};

const stepOneTitle = "Share your plans";

export const residentialPage: ServicePageContent = {
  meta: { title: "[[Residential SEO title]]", description: "[[Residential SEO description]]" },
  title: "Residential structural design",
  intro: "Permit-ready plans for custom homes, remodels, additions, decks and foundations. Fast, accurate and affordable.",
  heroPhoto: photos.framingWoodHero,
  heroPhotoSmall: photos.framingWoodSmall,
  overview:
    "We engineer residential structures to pass plan check and build cleanly in the field. From removing a load-bearing wall to a new custom home, the goal is simple: move your project forward quickly and correctly, with clear drawings, concise calculations and responsive communication.",
  whatWeDo: {
    heading: "What we do",
    items: [
      {
        title: "Custom and luxury homes",
        body: "Framing and lateral plans that work with the design; gravity, wind and seismic calculations.",
      },
      {
        title: "Production homes",
        body: "Value-engineered structural and foundation plans with clear, buildable details.",
      },
      {
        title: "Remodels and additions",
        body: "Removing bearing walls, floor and roof changes, decks and other additions.",
      },
      {
        title: "Foundations",
        body: "Spread footings, drilled piers and caissons, micropiles, helical piers.",
      },
      {
        title: "Retaining and site structures",
        body: "Cast-in-place concrete, masonry, gravity, Keystone and Redi-Rock walls.",
      },
    ],
    photos: [photos.remodelFramingCard, photos.rebarCard],
  },
  whatYouGet: {
    heading: "What you get",
    items: [
      "Permit-ready structural and foundation plans (PDF), with a stamped calculation package when your building department requires one.",
      "Clear assumptions, schedules and early RFIs to keep the project moving.",
      "Coordination with your architect or contractor during design, revisions for plan check comments, and answers to RFIs during construction.",
    ],
  },
  howWeWork: {
    heading: "How we work",
    stepTitle: stepOneTitle,
    stepBody:
      "Send drawings, sketches or site photos. We review the scope, ask the right questions and outline what a permit-ready package needs.",
  },
};

export const commercialPage: ServicePageContent = {
  meta: { title: "[[Low-rise commercial SEO title]]", description: "[[Low-rise commercial SEO description]]" },
  title: "Commercial design",
  intro: "Permit-ready engineering for retail, office buildings and tenant improvements.",
  heroPhoto: photos.commercialCraneHero,
  heroPhotoSmall: photos.commercialCraneSmall,
  overview:
    "We engineer low-rise commercial projects that meet submittal requirements and install cleanly in the field. From new builds to tenant improvements, our plans put constructability, clear connection details and fast turnaround first, so schedules hold and budgets stay in control.",
  whatWeDo: {
    heading: "What we do",
    items: [
      { title: "Retail and office" },
      { title: "Tenant improvements" },
      { title: "Pre-engineered metal building (PEMB) foundations" },
      { title: "Foundations and site structures" },
    ],
    photos: [photos.steelFrameCard],
  },
  whatYouGet: {
    heading: "What you get",
    items: [
      "Permit-ready structural and foundation plans (PDF), with a calculation package when your building department requires one.",
      "Clear assumptions, schedules and early RFIs to keep the project moving.",
      "Coordination with your architect or contractor from schematic design to final inspection, with timely revisions for plan check comments and RFIs.",
    ],
  },
  howWeWork: {
    heading: "How we work",
    stepTitle: stepOneTitle,
    stepBody:
      "Send drawings, sketches or site photos. We review the scope, ask the right questions and outline what a permit-ready package needs.",
  },
};

export const glazingPage: ServicePageContent = {
  meta: { title: "[[Glazing and mullion SEO title]]", description: "[[Glazing and mullion SEO description]]" },
  title: "Glazing engineering",
  intro: "Stamped calculation packages and redlines for storefront and curtainwall systems. Fast, accurate and affordable.",
  heroPhoto: photos.curtainWallHero,
  heroPhotoSmall: photos.curtainWallSmall,
  overview:
    "We engineer aluminum glazing, storefront and curtainwall mullion systems so they meet design loads and install cleanly in the field. Our packages focus on deflection control, anchorage, seismic drift compatibility and thermal expansion, backed by concise redlines and calculations.",
  whatWeDo: {
    heading: "What we do",
    items: [
      { title: "Storefront systems" },
      { title: "Curtainwall components" },
      { title: "Glass strength" },
      { title: "Sunshades" },
    ],
    photos: [photos.storefrontDuskCard, photos.louversCard],
  },
  whatYouGet: {
    heading: "What you get",
    items: [
      "Concise redlines on your plans, with a stamped calculation package when your building department requires one.",
      "Clear assumptions, schedules and early RFIs to keep the project moving.",
      "Coordination during design, revisions for plan check comments, and answers to RFIs during construction.",
    ],
  },
  howWeWork: {
    heading: "How we work",
    stepTitle: stepOneTitle,
    stepBody:
      "Send your preliminary drawings and we'll review the scope, ask the right questions and outline what a permit-ready package needs.",
  },
};
