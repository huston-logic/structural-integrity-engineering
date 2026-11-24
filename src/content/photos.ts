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
} as const satisfies Record<string, Photo>;
