import type { Metadata } from "next";
import { ContactBand } from "@/components/hl/ContactBand";
import { PageHero } from "@/components/hl/PageHero";
import { commercialPage } from "@/content/service-pages";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  ...commercialPage.meta,
  path: "/services/low-rise-commercial-structural-design",
});

/** Low-rise commercial service page (template until task 8): the H1 and a placeholder, then the contact band. */
export default function CommercialPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero title={commercialPage.title} intro={commercialPage.intro} />
      <ContactBand />
    </div>
  );
}
