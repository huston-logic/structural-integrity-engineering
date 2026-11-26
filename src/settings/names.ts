// The three settings files by name and where they live. Import-free, so scripts, the Worker and the build share one list.
export const SETTINGS_NAMES = ["business", "brand", "notice"] as const;
export type SettingsName = (typeof SETTINGS_NAMES)[number];
export const settingsPath = (name: SettingsName): string => `src/content/${name}.json`;

/**
 * Brand is fixed on this site (docs/SITE-DIFFERENCES.md D11): the colors and fonts stay in site.config.ts `theme` and the
 * logo is a drawn mark, so there is no src/content/brand.json and nothing generates a palette or fonts file from one.
 * This is the one switch. Set it to false (and add brand.json, then run sync:config) only to bring brand settings in.
 */
export const BRAND_FIXED = true;

/** What the site editor says to every request to change a color, a font or the logo while brand is fixed. */
export const BRAND_FIXED_MESSAGE = "On this site the colors, fonts and logo are set by Huston Logic, so they cannot be changed here. Ask Huston Logic.";

/** The settings files this site has. All three, unless brand is fixed. */
export const SITE_SETTINGS_NAMES: readonly SettingsName[] = SETTINGS_NAMES.filter((name) => !(BRAND_FIXED && name === "brand"));
