import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/blocks/BlockRenderer";
import { getPage, getPages } from "@/lib/pages";
import { pageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug: string[] }> };

// Only the live pages in src/content/pages are built; any other address is the 404.
export const dynamicParams = false;

/** The page address for a route's segments: ["services", "residential"] is "/services/residential". */
const pathOf = (slug: string[]) => `/${slug.join("/")}`;

export function generateStaticParams() {
  return getPages()
    .filter((page) => page.path !== "/")
    .map((page) => ({ slug: page.path.slice(1).split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(pathOf(slug));
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: page.path });
}

/** Every page except the home page: the blocks of its file in src/content/pages. A page path is one or two segments (docs/SITE-DIFFERENCES.md, D2). */
export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  const page = getPage(pathOf(slug));
  if (!page) notFound();
  // Keyed by path: moving between two pages of this route gives fresh block wrappers, so each page gets its entrance.
  return <BlockRenderer key={page.path} blocks={page.blocks} />;
}
