import type { Metadata } from "next";
import { ContactBand } from "@/components/hl/ContactBand";
import { PageHero } from "@/components/hl/PageHero";
import { residentialPage } from "@/content/service-pages";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  ...residentialPage.meta,
  path: "/services/residential-structural-design",
});

/** Residential service page (template until task 8): the H1 and a placeholder, then the contact band. */
export default function ResidentialPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero title={residentialPage.title} intro={residentialPage.intro} />
      <ContactBand />
    </div>
  );
}
