import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/content/site";
import { siteConfig as base } from "../../../site.config";

export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

// Hex values come from site.config.ts, the same source as the tokens in src/app/hl.css. ImageResponse cannot read CSS variables.
const { silver, ink, ink2, green, rust } = base.theme.colors;
const color = { silver, ink, ink2, green, rust };

/** Social preview card (CLIENT: replace the circle with the client's mark), generated at build time and served as /og.png. */
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
          background: color.silver,
          color: color.ink,
          padding: "0 96px",
          gap: 72,
          fontFamily: "Outfit",
        }}
      >
        <div style={{ width: 280, height: 280, borderRadius: 140, background: color.green }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 112, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2 }}>{siteConfig.name}</div>
          <div style={{ width: 96, height: 8, background: color.rust, margin: "32px 0" }} />
          <div style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.25, color: color.ink2 }}>
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
