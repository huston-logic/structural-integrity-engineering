// Photos on the site. Files live in public/images/ (pre-sized and stripped of hidden camera and location data).
// Credits are in docs/PHOTO-CREDITS.md and stay off the pages.

export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export const photos = {
  duskHome: {
    src: "/images/dusk-home.jpg",
    width: 2000,
    height: 2499,
    alt: "A modern two-story house with a white upper floor, wood soffits and glass walls, lit from inside at dusk above a snowy slope.",
  },
  /** dusk-home.jpg at 1200px for phones (the hero's srcset). Same aspect ratio, so the line drawing stays aligned. */
  duskHome1200: {
    src: "/images/dusk-home-1200.jpg",
    width: 1200,
    height: 1499,
    alt: "A modern two-story house with a white upper floor, wood soffits and glass walls, lit from inside at dusk above a snowy slope.",
  },
  /**
   * dusk-home.jpg at 800px (about 63 KB) for phone screens under 2x density (the hero's phone <source>). Same aspect
   * ratio, so the line drawing stays aligned.
   */
  duskHome800: {
    src: "/images/dusk-home-800.jpg",
    width: 800,
    height: 999,
    alt: "A modern two-story house with a white upper floor, wood soffits and glass walls, lit from inside at dusk above a snowy slope.",
  },
  duskHomeWide: {
    src: "/images/dusk-home-wide.jpg",
    width: 2000,
    height: 1250,
    alt: "A modern two-story house with glass walls and wood soffits, lit from inside at dusk, with snow in the foreground.",
  },
  chaletSnow: {
    src: "/images/chalet-snow.jpg",
    width: 987,
    height: 1480,
    alt: "A stone and log house with a car parked at the end of a deep snow drift in the driveway.",
  },
  // The home page's service cards: 4:5 crops (the option G reference's framing), each also at 660px for phones.
  chaletSnowCard: {
    src: "/images/chalet-snow-card.jpg",
    width: 987,
    height: 1234,
    alt: "A stone and log house with a car parked at the end of a deep snow drift in the driveway.",
  },
  chaletSnowCard660: {
    src: "/images/chalet-snow-card-660.jpg",
    width: 660,
    height: 825,
    alt: "A stone and log house with a car parked at the end of a deep snow drift in the driveway.",
  },
  commercialCraneCard: {
    src: "/images/commercial-crane-card.jpg",
    width: 1100,
    height: 1374,
    alt: "A multi-story wood-framed building under construction, wrapped in house wrap, with a yellow tower crane above it.",
  },
  commercialCraneCard660: {
    src: "/images/commercial-crane-card-660.jpg",
    width: 660,
    height: 825,
    alt: "A multi-story wood-framed building under construction, wrapped in house wrap, with a yellow tower crane above it.",
  },
  curtainWallCard: {
    src: "/images/curtain-wall-card.jpg",
    width: 1100,
    height: 1375,
    alt: "Looking up at the glass curtain wall of a tall building, with the sky and clouds reflected in the panels.",
  },
  curtainWallCard660: {
    src: "/images/curtain-wall-card-660.jpg",
    width: 660,
    height: 825,
    alt: "Looking up at the glass curtain wall of a tall building, with the sky and clouds reflected in the panels.",
  },
  framingWood: {
    src: "/images/framing-wood.jpg",
    width: 2070,
    height: 1381,
    alt: "Looking up at a wood roof frame of rafters and beams against a blue sky with clouds.",
  },
  commercialCrane: {
    src: "/images/commercial-crane.jpg",
    width: 2071,
    height: 1381,
    alt: "A multi-story wood-framed building under construction, wrapped in house wrap, with a yellow tower crane above it.",
  },
  curtainWall: {
    src: "/images/curtain-wall.jpg",
    width: 2070,
    height: 1380,
    alt: "Looking up at the glass curtain wall of a tall building, with the sky and clouds reflected in the panels.",
  },
  engineerPlans: {
    src: "/images/engineer-plans.jpg",
    width: 1125,
    height: 750,
    alt: "An engineer in a hard hat points at a floor plan pinned to a concrete column inside an unfinished building.",
  },
  engineerPlansSmall: {
    src: "/images/engineer-plans-800.jpg",
    width: 800,
    height: 533,
    alt: "An engineer in a hard hat points at a floor plan pinned to a concrete column inside an unfinished building.",
  },
  chaletSnowServicesCard: {
    src: "/images/chalet-snow-640.jpg",
    width: 640,
    height: 960,
    alt: "A stone and log house with a car parked at the end of a deep snow drift in the driveway.",
  },
  commercialCraneServicesCard: {
    src: "/images/commercial-crane-640.jpg",
    width: 640,
    height: 426,
    alt: "A multi-story wood-framed building under construction, wrapped in house wrap, with a yellow tower crane above it.",
  },
  curtainWallServicesCard: {
    src: "/images/curtain-wall-640.jpg",
    width: 640,
    height: 426,
    alt: "Looking up at the glass curtain wall of a tall building, with the sky and clouds reflected in the panels.",
  },
  remodelFraming: {
    src: "/images/remodel-framing.jpg",
    width: 800,
    height: 1200,
    alt: "Wood wall studs in an interior under construction, with sheathing and a window opening visible behind them.",
  },
  rebar: {
    src: "/images/rebar.jpg",
    width: 1200,
    height: 800,
    alt: "Steel reinforcing bars bent into a cage, seen from below against a pale sky beside a concrete wall.",
  },
  steelFrame: {
    src: "/images/steel-frame.jpg",
    width: 1200,
    height: 799,
    alt: "Aerial view of a steel frame building under construction, with workers on lifts and the shadows of the beams on the ground.",
  },
  storefrontDusk: {
    src: "/images/storefront-dusk.jpg",
    width: 1200,
    height: 675,
    alt: "A computer rendering of a tall building with a glass base and lit ground-floor storefronts at dusk.",
  },
  louvers: {
    src: "/images/louvers.jpg",
    width: 800,
    height: 1200,
    alt: "Close view of a glass facade with angled metal louvers running up the building.",
  },
  alaskaChugach: {
    src: "/images/alaska-chugach.jpg",
    width: 1200,
    height: 800,
    alt: "Snow-covered mountain ridges in warm, low sunlight under a pale yellow sky.",
  },
  coloradoPikesPeak: {
    src: "/images/colorado-pikes-peak.jpg",
    width: 1200,
    height: 800,
    alt: "A snow-dusted mountain rising behind pine trees and a split-rail fence in winter.",
  },
  dylanPortrait: {
    src: "/images/dylan-portrait.jpg",
    width: 900,
    height: 1200,
    alt: "Portrait of Dylan Gassmann, principal engineer, smiling in front of a brick wall.",
  },
  // Sized copies for the three service pages: a 900px hero for desktop, an 800px hero for phones, small crops for the
  // secondary photos.
  framingWoodHero: {
    src: "/images/framing-wood-900.jpg",
    width: 900,
    height: 600,
    alt: "Looking up at a wood roof frame of rafters and beams against a blue sky with clouds.",
  },
  framingWoodSmall: {
    src: "/images/framing-wood-800.jpg",
    width: 800,
    height: 533,
    alt: "Looking up at a wood roof frame of rafters and beams against a blue sky with clouds.",
  },
  commercialCraneHero: {
    src: "/images/commercial-crane-900.jpg",
    width: 900,
    height: 600,
    alt: "A multi-story wood-framed building under construction, wrapped in house wrap, with a yellow tower crane above it.",
  },
  commercialCraneSmall: {
    src: "/images/commercial-crane-800.jpg",
    width: 800,
    height: 533,
    alt: "A multi-story wood-framed building under construction, wrapped in house wrap, with a yellow tower crane above it.",
  },
  curtainWallHero: {
    src: "/images/curtain-wall-900.jpg",
    width: 900,
    height: 600,
    alt: "Looking up at the glass curtain wall of a tall building, with the sky and clouds reflected in the panels.",
  },
  curtainWallSmall: {
    src: "/images/curtain-wall-800.jpg",
    width: 800,
    height: 533,
    alt: "Looking up at the glass curtain wall of a tall building, with the sky and clouds reflected in the panels.",
  },
  remodelFramingCard: {
    src: "/images/remodel-framing-640.jpg",
    width: 640,
    height: 960,
    alt: "Wood wall studs in an interior under construction, with sheathing and a window opening visible behind them.",
  },
  rebarCard: {
    src: "/images/rebar-800.jpg",
    width: 800,
    height: 533,
    alt: "Steel reinforcing bars bent into a cage, seen from below against a pale sky beside a concrete wall.",
  },
  steelFrameCard: {
    src: "/images/steel-frame-800.jpg",
    width: 800,
    height: 532,
    alt: "Aerial view of a steel frame building under construction, with workers on lifts and the shadows of the beams on the ground.",
  },
  storefrontDuskCard: {
    src: "/images/storefront-dusk-800.jpg",
    width: 800,
    height: 450,
    alt: "A computer rendering of a tall building with a glass base and lit ground-floor storefronts at dusk.",
  },
  louversCard: {
    src: "/images/louvers-560.jpg",
    width: 560,
    height: 840,
    alt: "Close view of a glass facade with angled metal louvers running up the building.",
  },
} as const satisfies Record<string, Photo>;
