// Home page copy, word for word from the copy deck (incoming/sie-site-assets/copy-deck.md, "Home"). The contact band
// that ends the page is shared (shared.ts), and the button label and address come from nav.ts (requestQuote).
import { photos, type Photo } from "./photos";
import { servicePages } from "./nav";

/** The copy deck has no SEO title or description for Home yet (task 11). */
export const homeMeta = {
  title: "[[Home page SEO title]]",
  description: "[[Home page SEO description]]",
};

export const hero = {
  title: "Strength you can build on.",
  intro:
    "Structural engineering for homes, low-rise commercial buildings and glazing systems in Colorado and Alaska.",
  photo: photos.duskHome,
  /** The same photo at 1200px, offered to phones through srcset. */
  photoSmall: photos.duskHome1200,
  /** The labels on the amber line drawing over the house. The drawing is decorative (aria-hidden). */
  labels: { cantilever: "Cantilever", clearSpan: "Clear span", wind: "Wind" },
};

/** The four design conditions; `glyph` picks the amber line glyph drawn beside each (ConditionGlyph). */
export type ConditionGlyphName = "snow" | "wind" | "seismic" | "temperature";

export const conditions = {
  heading: "Built for every condition",
  intro:
    "From Colorado to Alaska, our experience with cold climates, wind and seismic conditions means every project is built to last.",
  items: [
    { glyph: "snow", title: "Heavy snow", body: "Roof framing, beams and connections sized for heavy snow loads." },
    {
      glyph: "wind",
      title: "High wind",
      body: "Lateral systems and uplift connections checked against the wind at your site.",
    },
    {
      glyph: "seismic",
      title: "Seismic activity",
      body: "Shear walls, hold-downs and foundations that work together when the ground moves.",
    },
    {
      glyph: "temperature",
      title: "Temperature swings",
      body: "Details that allow for movement through extreme temperature shifts.",
    },
  ] satisfies readonly { glyph: ConditionGlyphName; title: string; body: string }[],
};

export type ServiceCard = {
  title: string;
  body: string;
  href: string;
  /** The card photo, already cropped to 4:5 as in the option G reference. */
  photo: Photo;
  /** The same crop at 660px, offered to phones through srcset. */
  photoSmall: Photo;
};

const [residential, commercial, glazing] = servicePages;

/** "What we design": three photo cards, each linking to its service page. */
export const services = {
  heading: "What we design",
  intro:
    "We partner with architects, builders and homeowners to keep projects moving with clear drawings, responsive communication and clean calculations.",
  items: [
    {
      title: "Residential",
      body: "Structural and foundation designs for custom homes, master plans, remodels, additions and decks, tailored for permitting and construction.",
      href: residential.href,
      photo: photos.chaletSnowCard,
      photoSmall: photos.chaletSnowCard660,
    },
    {
      title: "Low-rise commercial",
      body: "Structural and foundation designs for retail, office and tenant improvements, tailored for permitting and construction.",
      href: commercial.href,
      photo: photos.commercialCraneCard,
      photoSmall: photos.commercialCraneCard660,
    },
    {
      title: "Glazing and mullion",
      body: "Redlines and structural calculations for glazing, mullion, facade, storefront, curtainwall and sunshade systems.",
      href: glazing.href,
      photo: photos.curtainWallCard,
      photoSmall: photos.curtainWallCard660,
    },
  ] satisfies readonly ServiceCard[],
};

/**
 * The numbers. `value` is the figure (it counts up on screen; the real value is always in the HTML), `unit` sits beside
 * it and `body` under it, as the copy deck writes them ("48 hours: to a clear proposal ...").
 */
export const numbers = {
  items: [
    { value: 48, unit: "hours", body: "to a clear proposal with deliverables, pricing and schedule" },
    { value: 10, unit: "years", body: "of hands-on structural engineering" },
    { value: 2, unit: "states", body: "licensed in Colorado and Alaska" },
  ],
};

export const reasons = {
  heading: "Why builders call us back",
  items: [
    {
      title: "Fast and responsive",
      body: "Questions don't sit unanswered. We respond to RFIs quickly to keep the project moving.",
    },
    {
      title: "Permit-ready packages",
      body: "Clear drawings and stamped calculations that satisfy the submittal requirements.",
    },
  ],
};
