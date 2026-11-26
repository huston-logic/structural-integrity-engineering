// This site's palette is Dusk (dusk, snow, night ...), not the template's (white, ink, green ...). The owner page is a
// plain light page, so Dusk's light and dark colors are mapped onto the page's ten roles here, the one place
// (docs/SITE-DIFFERENCES.md, D8). Import-free apart from a type.
import type { ThemeColors } from "./owner-page.ts";

/** The Dusk colors the owner page uses, as `siteConfig.theme.colors` holds them. */
export interface DuskColors {
  dusk: string;
  duskDeep: string;
  night: string;
  snow: string;
  mist: string;
  rule: string;
}

export function ownerTheme(colors: DuskColors): ThemeColors {
  return {
    white: colors.snow,
    ink: colors.night,
    ink2: colors.duskDeep,
    silver: colors.mist,
    silver2: colors.mist,
    green: colors.dusk,
    greenDeep: colors.duskDeep,
    // Dusk has no red that reads on a light page, so the page's own dark rust (its built-in fallback) is used.
    rust: "",
    line: colors.rule,
    tint: colors.snow,
  };
}
