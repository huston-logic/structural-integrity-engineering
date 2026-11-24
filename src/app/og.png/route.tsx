import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/content/site";
import { siteConfig as base } from "../../../site.config";

export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

// Hex values come from site.config.ts, the same source as the tokens in src/app/hl.css. ImageResponse cannot read CSS variables.
const { dusk, duskDeep, snow, mist, amber } = base.theme.colors;
const color = { dusk, duskDeep, snow, mist, amber };

// LIMITATION: satori (ImageResponse) reads only TTF/OTF, and next/font self-hosts Manrope as woff2, which it cannot
// parse. No Manrope TTF is in node_modules or on this machine, and fetching one needs a download Grant has not approved.
// So the card still uses the template's Outfit TTFs (src/assets/og). To finish: add Manrope-Regular.ttf and
// Manrope-SemiBold.ttf (SIL OFL) to src/assets/og, and change the two file names and the font name below.
/** Social preview card in the option G palette, generated at build time and served as /og.png. */
export async function GET() {
  const [regular, semiBold] = await Promise.all([
    readFile(path.join(process.cwd(), "src/assets/og/Outfit-Regular.ttf")),
    readFile(path.join(process.cwd(), "src/assets/og/Outfit-SemiBold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: color.dusk,
          color: color.snow,
          padding: "0 96px",
          gap: 72,
          fontFamily: "Outfit",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 320,
            height: 320,
            background: color.duskDeep,
            flexShrink: 0,
          }}
        >
          {/* A cantilevered frame in amber line art, the same line language as the home hero. No text. */}
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none" stroke={color.amber} strokeWidth="6">
            <path d="M20 200 H150 M40 200 V80 L110 30 L180 80 V200 M110 30 V200 M40 120 H220 M40 80 H180" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 96, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>{siteConfig.name}</div>
          <div style={{ width: 96, height: 8, background: color.amber, margin: "32px 0" }} />
          <div style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.25, color: color.mist }}>
            {siteConfig.tagline}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Outfit", data: regular, weight: 400, style: "normal" },
        { name: "Outfit", data: semiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
