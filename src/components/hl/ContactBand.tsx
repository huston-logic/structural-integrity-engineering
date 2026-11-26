import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { contactBand } from "@/content/shared";
import { directContact } from "@/lib/direct-contact";
import { Button } from "./Button";
import { Container } from "./Container";
import { TextLink } from "./TextLink";

type ContactBandProps = {
  heading: string;
  body: string;
  /** The Request a quote button. */
  action: { label: string; href: string };
};

/**
 * The contact band that ends every page (copy deck, "Contact band"): the headline, the line under it, the Request a
 * quote button, then the phone number and email (from business.json). Centered on dusk, as in the option G reference.
 * With `contactBand.photo` (shared.ts) set, the photo sits behind a dusk wash dense enough to keep the text at AA.
 * One per page (its heading id is fixed).
 */
export function ContactBand({ heading, body, action }: ContactBandProps) {
  const { phone, tel, email } = directContact();
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
      <Container className="flex flex-col items-center py-24 text-center md:pb-28 md:pt-26">
        <h2 id="contact-band-title" className="reveal max-w-em-14 text-band">
          <Text>{heading}</Text>
        </h2>
        <p className="mt-6 max-w-em-30 text-mist">
          <Text>{body}</Text>
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          <Button href={action.href}>{action.label}</Button>
          {tel ? <TextLink href={tel}>{phone}</TextLink> : null}
          {email ? (
            <TextLink href={`mailto:${email}`} className="wrap-anywhere">
              {email}
            </TextLink>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
