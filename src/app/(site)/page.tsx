import type { Metadata } from "next";
import { Button } from "@/components/hl/Button";
import { ClosingCta } from "@/components/hl/ClosingCta";
import { PageHero } from "@/components/hl/PageHero";
import { ReasonList } from "@/components/hl/ReasonList";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { JsonLd } from "@/components/ui/JsonLd";
import { closingCta, hero, highlights, homeMeta } from "@/content/home";
import { pageMetadata } from "@/lib/metadata";
import { organizationJsonLd } from "@/lib/site-organization";

export const metadata: Metadata = pageMetadata({ ...homeMeta, path: "/" });

/** Home: one H1 (the hero), then a highlights list and the closing call to action. */
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
      <ClosingCta heading={closingCta.heading} body={closingCta.body} note={closingCta.note}>
        {book ? <Button href={book}>{closingCta.cta}</Button> : null}
      </ClosingCta>
    </div>
  );
}
