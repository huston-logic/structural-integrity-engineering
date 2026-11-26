import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/content/site";
import { fontVariables } from "@/lib/fonts";
import { OG_IMAGE_PATH, ogImages, siteName } from "@/lib/metadata";
import { getPage } from "@/lib/pages";
import { siteConfig as base } from "../../site.config";
import "./globals.css";

// The site-wide default title and description are the home page's (src/content/pages/home.json).
const home = getPage("/");

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: home?.title ?? siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: home?.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.founder }],
  openGraph: {
    type: "website",
    siteName: siteName(),
    locale: "en_US",
    images: ogImages(),
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE_PATH] },
};

export const viewport: Viewport = {
  themeColor: base.theme.colors.dusk,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior: hl.css sets `scroll-behavior: smooth` on html (§9.1). Since Next 16 the router no longer
    // switches it off for a page change, so a new page glided to whichever section its scrollIntoView calls ended on.
    // This attribute asks Next to switch it off during the page change only (tests/a11y/navigation.spec.ts).
    <html lang="en" suppressHydrationWarning className={fontVariables} data-scroll-behavior="smooth">
      <head>
        <script>{"document.documentElement.classList.add('js')"}</script>
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-pill bg-amber px-5 py-3 font-bold text-night focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        {/* The header, main and footer come from app/(site)/layout.tsx (SiteChrome). */}
        {children}
      </body>
    </html>
  );
}
