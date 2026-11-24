import type { Metadata } from "next";
import { ContactBand } from "@/components/hl/ContactBand";
import { PageHero } from "@/components/hl/PageHero";
import { glazingPage } from "@/content/service-pages";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  ...glazingPage.meta,
  path: "/services/glazing-and-mullion-engineering",
});

/** Glazing and mullion service page (template until task 8): the H1 and a placeholder, then the contact band. */
export default function GlazingPage() {
  return (
    <div className="relative overflow-x-clip">
      <PageHero title={glazingPage.title} intro={glazingPage.intro} />
      <ContactBand />
    </div>
  );
}
