import type { Metadata } from "next";
import { siteConfig } from "@/content/site";
import { getBusiness } from "./settings";

type PageMetaInput = {
  /** Full `<title>` text, exactly as specified in the content docs. */
  title: string;
  /** null leaves the description out (the privacy page has no deck text to build one from). */
  description: string | null;
  /** Route path starting with "/". Used for the canonical URL. */
  path: string;
  noindex?: boolean;
  /** An article (a blog post): sets og:type article and the published time. */
  article?: { publishedTime: string; modifiedTime?: string };
  /** Adds the RSS feed as an alternate link. */
  feed?: boolean;
};

export const FEED_PATH = "/blog/feed.xml";
export const OG_IMAGE_PATH = "/og.png";

/** The business name from business.json: the site name in social previews and the preview image's alt text. */
export function siteName(): string {
  return getBusiness().name;
}

export function ogImages() {
  return [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: siteName() }];
}

export function absoluteUrl(path: string): string {
  return `${siteConfig.url}${path}`;
}

export function pageMetadata({ title, description: rawDescription, path, noindex = false, article, feed = false }: PageMetaInput): Metadata {
  const description = rawDescription ?? undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path, ...(feed ? { types: { "application/rss+xml": FEED_PATH } } : {}) },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      ...(article === undefined
        ? { type: "website" as const }
        : { type: "article" as const, publishedTime: article.publishedTime, ...(article.modifiedTime === undefined ? {} : { modifiedTime: article.modifiedTime }) }),
      siteName: siteName(),
      locale: "en_US",
      title,
      description,
      url: path,
      images: ogImages(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}
