import type { Metadata } from "next";
import { BlockRenderer } from "@/blocks/BlockRenderer";
import { JsonLd } from "@/components/ui/JsonLd";
import { getPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/metadata";
import { organizationJsonLd } from "@/lib/site-organization";

function homePage() {
  const page = getPage("/");
  if (!page) throw new Error("The home page (src/content/pages/home.json) must be live.");
  return page;
}

export function generateMetadata(): Metadata {
  const { title, description } = homePage();
  return pageMetadata({ title, description, path: "/" });
}

/** Home: the blocks of home.json, with the Organization JSON-LD (this page only). */
export default function HomePage() {
  const organization = organizationJsonLd();
  return (
    <>
      {organization ? <JsonLd data={organization} /> : null}
      <BlockRenderer blocks={homePage().blocks} />
    </>
  );
}
