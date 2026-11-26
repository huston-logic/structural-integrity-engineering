// The size of every photo a page uses, and the smaller copies phones are offered. Files live in public/images/ (pre-sized
// and stripped of hidden camera and location data); credits are in docs/PHOTO-CREDITS.md and stay off the pages. A photo's
// alt text is not here: it is written next to the picture in the page file (src/content/pages/*.json).
//
// A page names a photo by its path. The block that shows it looks the path up here (src/lib/photo-files.ts) for the size
// the image tag needs, so the page does not jump while the photo loads. A new photo needs one line here.
//   small: a smaller copy of the same picture (same shape) for phones.
//   phone: the smallest copy, for phone screens under 2x density (the home hero only).

type PhotoCopy = { src: string; width: number; height: number };

export const photoFiles = {
  "/images/dusk-home.jpg": {
    width: 2000,
    height: 2499,
    // 1200px copy for phones (the hero's srcset) and an 800px copy (about 63 KB) for phone screens under 2x density. Same
    // aspect ratio as the full file, so the line drawing stays aligned.
    small: { src: "/images/dusk-home-1200.jpg", width: 1200, height: 1499 },
    phone: { src: "/images/dusk-home-800.jpg", width: 800, height: 999 },
  },
  // The home page's service cards: 4:5 crops (the option G reference's framing), each also at 660px for phones.
  "/images/chalet-snow-card.jpg": { width: 987, height: 1234, small: { src: "/images/chalet-snow-card-660.jpg", width: 660, height: 825 } },
  "/images/commercial-crane-card.jpg": { width: 1100, height: 1374, small: { src: "/images/commercial-crane-card-660.jpg", width: 660, height: 825 } },
  "/images/curtain-wall-card.jpg": { width: 1100, height: 1375, small: { src: "/images/curtain-wall-card-660.jpg", width: 660, height: 825 } },
  // The Services page: the hero (with an 800px copy for phones) and the three cards.
  "/images/engineer-plans.jpg": { width: 1125, height: 750, small: { src: "/images/engineer-plans-800.jpg", width: 800, height: 533 } },
  "/images/chalet-snow-640.jpg": { width: 640, height: 960 },
  "/images/commercial-crane-640.jpg": { width: 640, height: 426 },
  "/images/curtain-wall-640.jpg": { width: 640, height: 426 },
  // About.
  "/images/dylan-portrait.jpg": { width: 900, height: 1200 },
  "/images/colorado-pikes-peak.jpg": { width: 1200, height: 800 },
  // The three service pages: a 900px hero for desktop with an 800px copy for phones, and small crops for the other photos.
  "/images/framing-wood-900.jpg": { width: 900, height: 600, small: { src: "/images/framing-wood-800.jpg", width: 800, height: 533 } },
  "/images/commercial-crane-900.jpg": { width: 900, height: 600, small: { src: "/images/commercial-crane-800.jpg", width: 800, height: 533 } },
  "/images/curtain-wall-900.jpg": { width: 900, height: 600, small: { src: "/images/curtain-wall-800.jpg", width: 800, height: 533 } },
  "/images/remodel-framing-640.jpg": { width: 640, height: 960 },
  "/images/rebar-800.jpg": { width: 800, height: 533 },
  "/images/steel-frame-800.jpg": { width: 800, height: 532 },
  "/images/storefront-dusk-800.jpg": { width: 800, height: 524 },
  "/images/louvers-560.jpg": { width: 560, height: 840 },
} as const satisfies Record<string, { width: number; height: number; small?: PhotoCopy; phone?: PhotoCopy }>;
