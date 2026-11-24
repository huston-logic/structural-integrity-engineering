import { Manrope } from "next/font/google";

// Fonts (docs/STYLE-GUIDE.md §3), generated from site.config.ts theme.fonts by `npm run sync:config`. Each is
// self-hosted at build time by next/font; no third-party font tags.

/** Manrope. Display and UI: headings, nav, buttons, labels. Also the body face when no body font is set. */
export const displayFont = Manrope({
  subsets: ["latin"],
  variable: "--hl-font-display",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/** The font CSS variables, as class names for <html> (src/app/layout.tsx). */
export const fontVariables = [displayFont.variable].join(" ");
