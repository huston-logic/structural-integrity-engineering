import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { ContactBand } from "@/components/hl/ContactBand";
import { PageHero } from "@/components/hl/PageHero";
import { ReasonList } from "@/components/hl/ReasonList";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { JsonLd } from "@/components/ui/JsonLd";
import { hero, highlights, homeMeta } from "@/content/home";
import { pageMetadata } from "@/lib/metadata";
import { organizationJsonLd } from "@/lib/site-organization";

export const metadata: Metadata = pageMetadata({ ...homeMeta, path: "/" });

/** Home (template content until task 5): one H1 (the hero), a highlights list and the contact band. */
export default function HomePage() {
  const organization = organizationJsonLd();
  const book = bookCallHref();
  return (
    <div className="relative overflow-x-clip">
      {organization ? <JsonLd data={organization} /> : null}
      <PageHero eyebrow={hero.eyebrow} title={hero.title} intro={hero.intro}>
        {book ? <Button href={book}>{hero.cta}</Button> : null}
      </PageHero>
      <ReasonList id="highlights" heading={highlights.heading} items={highlights.items} />
      <ContactBand />
    </div>
  );
}
