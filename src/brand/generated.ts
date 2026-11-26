// The two files generated from src/content/brand.json (`npm run sync:config`). Import-free, so scripts, the Worker and
// the build name them in one place. While brand is fixed (src/settings/names.ts, BRAND_FIXED) nothing is generated from
// a brand.json, so the list is empty.
import { BRAND_FIXED } from "../settings/names.ts";

export const PALETTE_PATH = "src/app/palette.css";
export const FONTS_PATH = "src/lib/fonts.ts";
export const GENERATED_BRAND_FILES: readonly string[] = BRAND_FIXED ? [] : [PALETTE_PATH, FONTS_PATH];
