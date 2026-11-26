// One-off generator for the showcase photos in public/images/examples/: six abstract still lifes drawn in HTML from the
// theme palette in site.config.ts and saved as JPEG with the installed Google Chrome (no browser download).
// Run: node scripts/make-example-photos.mjs   then: npm run strip:images -- --all
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = new URL("..", import.meta.url).pathname;
const { siteConfig } = await import(pathToFileURL(join(root, "site.config.ts")).href);
const c = siteConfig.theme.colors;
const out = join(root, "public/images/examples");
mkdirSync(out, { recursive: true });

const W = 1600;
const H = 1200;
const TABLE = 820; // y of the table's back edge

/** A ball-like shaded colour: light from the upper left. */
const shade = (color) =>
  `radial-gradient(circle at 30% 24%, color-mix(in srgb, ${color} 55%, white), ${color} 48%, color-mix(in srgb, ${color} 62%, black))`;

/** An object standing on the table. (x, y) is the bottom centre. */
function obj(x, y, w, h, color, radius, extra = "") {
  return (
    `<i class="s" style="left:${x - w * 0.55}px;top:${y - h * 0.06}px;width:${w * 1.45}px;height:${h * 0.14}px"></i>` +
    `<i style="left:${x - w / 2}px;top:${y - h}px;width:${w}px;height:${h}px;background:${shade(color)};border-radius:${radius};${extra}"></i>`
  );
}

const flat = (x, y, w, h, color, radius = "4px", extra = "") =>
  `<i style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${color};border-radius:${radius};${extra}"></i>`;

const scenes = {
  "vase-and-pears": [
    obj(660, 560, 110, 190, c.mint, "22px 22px 8px 8px"),
    obj(660, 900, 330, 400, c.glow, "46% 46% 50% 50% / 38% 38% 62% 62%"),
    obj(1000, 930, 200, 300, c.green, "46% 46% 52% 52% / 26% 26% 74% 74%"),
    flat(996, 612, 8, 40, c.ink2, "4px", "transform:rotate(8deg)"),
    obj(1200, 950, 180, 270, c.rust, "46% 46% 52% 52% / 26% 26% 74% 74%"),
    flat(1196, 700, 8, 36, c.ink2, "4px", "transform:rotate(-8deg)"),
  ],
  "bowl-and-lemons": [
    obj(800, 930, 640, 190, c.silver2, "8% 8% 50% 50% / 10% 10% 90% 90%"),
    obj(650, 780, 190, 150, c.glow, "50%"),
    obj(820, 760, 200, 160, c.greenEdge, "50%"),
    obj(980, 790, 180, 140, c.glow, "50%"),
    obj(1260, 920, 150, 150, c.rust, "50%"),
  ],
  "jug-and-cups": [
    obj(620, 930, 280, 470, c.greenEdge, "30% 30% 40% 40% / 14% 14% 20% 20%"),
    flat(745, 600, 90, 210, "transparent", "0 90px 90px 0", `border:26px solid ${c.greenEdge};border-left:none;`),
    obj(1010, 930, 170, 150, c.silver2, "6% 6% 40% 40% / 6% 6% 55% 55%"),
    obj(1230, 950, 170, 150, c.glow, "6% 6% 40% 40% / 6% 6% 55% 55%"),
  ],
  "stacked-books": [
    obj(800, 930, 640, 120, c.green, "6px"),
    obj(830, 810, 560, 110, c.silver2, "6px"),
    obj(790, 700, 500, 100, c.rust, "6px"),
    obj(800, 600, 170, 170, c.mint, "50%", `box-shadow:inset 0 0 40px ${c.glow};`),
  ],
  "candle-and-plate": [
    obj(800, 960, 700, 90, c.silver2, "50%"),
    obj(800, 930, 520, 60, c.white, "50%"),
    obj(1000, 880, 110, 340, c.mint, "10px 10px 6px 6px"),
    flat(1038, 500, 34, 66, `radial-gradient(ellipse at 50% 75%, ${c.white}, ${c.glow} 60%, transparent 72%)`, "50% 50% 50% 50% / 70% 70% 30% 30%"),
    obj(560, 920, 180, 230, c.green, "50% 50% 50% 50% / 30% 30% 70% 70%"),
  ],
  "window-light": [
    obj(700, 950, 260, 220, c.greenEdge, "50% 50% 14% 14% / 40% 40% 14% 14%"),
    flat(560, 600, 18, 130, c.green, "9px", "transform:rotate(-24deg);transform-origin:bottom"),
    flat(640, 560, 18, 170, c.green, "9px", "transform:rotate(4deg);transform-origin:bottom"),
    flat(720, 600, 18, 140, c.green, "9px", "transform:rotate(26deg);transform-origin:bottom"),
    obj(1130, 960, 360, 120, c.mint, "50%"),
    obj(1130, 850, 280, 100, c.silver2, "50%"),
  ],
};

// Each scene gets a slightly different wall and light so the six read as a set, not as one picture repeated.
const walls = {
  "vase-and-pears": [c.silver, c.tint],
  "bowl-and-lemons": [c.tint, c.silver],
  "jug-and-cups": [c.silver2, c.mint],
  "stacked-books": [c.tint, c.glow],
  "candle-and-plate": [c.silver2, c.glow],
  "window-light": [c.silver, c.mint],
};

function page(name) {
  const [a, b] = walls[name];
  return `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
    body{position:relative;background:linear-gradient(160deg,${a},${b})}
    i{position:absolute;display:block}
    .table{left:0;top:${TABLE}px;width:${W}px;height:${H - TABLE}px;background:linear-gradient(${c.silver2},color-mix(in srgb,${c.silver2} 78%,${c.ink2}))}
    .window{left:1020px;top:-80px;width:520px;height:640px;background:linear-gradient(${c.white},color-mix(in srgb,${c.white} 60%,transparent));filter:blur(26px);transform:skewX(-14deg);opacity:.85}
    .beam{left:700px;top:${TABLE - 40}px;width:900px;height:380px;background:linear-gradient(100deg,transparent,color-mix(in srgb,${c.white} 55%,transparent) 40%,transparent);filter:blur(30px);transform:skewX(-34deg);opacity:.8}
    .s{background:color-mix(in srgb,${c.ink2} 34%,transparent);filter:blur(22px);border-radius:50%}
    .vig{inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 55%,color-mix(in srgb,${c.ink} 22%,transparent))}
  </style>
  <i class="window"></i><i class="table"></i><i class="beam"></i>${scenes[name].join("")}<i class="vig"></i>`;
}

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const tab = await context.newPage();
for (const name of Object.keys(scenes)) {
  await tab.setContent(page(name));
  let quality = 82;
  let bytes;
  do {
    bytes = await tab.screenshot({ type: "jpeg", quality });
    quality -= 6;
  } while (bytes.length > 140_000 && quality > 30);
  const file = join(out, `${name}.jpg`);
  writeFileSync(file, bytes);
  console.log(`${name}.jpg ${Math.round(statSync(file).size / 1024)} KB`);
}
await browser.close();
