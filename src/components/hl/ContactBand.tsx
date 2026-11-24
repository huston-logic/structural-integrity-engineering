import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { requestQuote } from "@/content/nav";
import { contactBand } from "@/content/shared";
import { siteConfig } from "@/content/site";
import { telHref } from "@/lib/phone";
import { Button } from "./Button";
import { Container } from "./Container";
import { TextLink } from "./TextLink";

/**
 * The contact band that ends every page (copy deck, "Contact band"): the headline, the line under it, the Request a
 * quote button, then the phone number and email. Centered on dusk, as in the option G reference. With
 * `contactBand.photo` set, the photo sits behind a dusk wash dense enough to keep the text at AA.
 * One per page (its heading id is fixed).
 */
export function ContactBand() {
  const tel = telHref(siteConfig.phone);
  const { photo } = contactBand;
  return (
    <section aria-labelledby="contact-band-title" className="relative isolate overflow-hidden bg-dusk">
      {photo ? (
        <>
          <Image
            src={photo.src}
            alt=""
            width={photo.width}
            height={photo.height}
            loading="lazy"
            sizes="100vw"
            className="absolute inset-0 -z-20 size-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-dusk/[0.88]" />
        </>
      ) : null}
      <Container className="flex flex-col items-center py-24 text-center md:pb-28 md:pt-[104px]">
        <h2 id="contact-band-title" className="reveal max-w-[14em] text-band">
          <Text>{contactBand.heading}</Text>
        </h2>
        <p className="mt-6 max-w-[30em] text-mist">
          <Text>{contactBand.body}</Text>
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          <Button href={requestQuote.href}>{requestQuote.label}</Button>
          {tel ? <TextLink href={tel}>{siteConfig.phone}</TextLink> : null}
          {siteConfig.email ? (
            <TextLink href={`mailto:${siteConfig.email}`} className="[overflow-wrap:anywhere]">
              {siteConfig.email}
            </TextLink>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
