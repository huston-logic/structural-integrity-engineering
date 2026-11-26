import type { ReactNode } from "react";
import { Text } from "@/components/ui/Text";
import { directContact } from "@/lib/direct-contact";
import { Container } from "./Container";
import { FadingDivider } from "./FadingDivider";
import { PageDrawing } from "./PageDrawing";
import { TextLink } from "./TextLink";

type ContactHeroProps = {
  title: string;
  intro: string;
  /** The six-field form. */
  children: ReactNode;
  /** H1 on the page itself; H2 where the block is shown as an example. */
  headingLevel?: "h1" | "h2";
};

/**
 * The contact page, form first (copy deck: "None (form first)"): from 900px the headline, the line and the direct email
 * and phone (from business.json) stay in the left column while the form fills the right; on phones they stack above it.
 */
export function ContactHero({ title, intro, children, headingLevel = "h1" }: ContactHeroProps) {
  const Heading = headingLevel;
  const { phone, tel, email } = directContact();
  return (
    <section className="bg-dusk pb-16 pt-12 md:pb-24 md:pt-24">
      <Container className="grid items-start gap-12 split:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] split:gap-16 lg:gap-24">
        <div className="split:sticky split:top-below-header">
          <Heading className="max-w-em-10 text-title">
            <Text>{title}</Text>
          </Heading>
          <p className="mt-6 max-w-em-30 text-mist">
            <Text>{intro}</Text>
          </p>
          <FadingDivider className="my-8 max-w-em-30" />
          <div className="flex flex-col items-start">
            {email ? (
              <TextLink href={`mailto:${email}`} className="wrap-anywhere">
                {email}
              </TextLink>
            ) : null}
            {tel ? <TextLink href={tel}>{phone}</TextLink> : null}
          </div>
          <PageDrawing name="contact" className="mt-14 hidden max-w-art-wide split:block" />
        </div>
        {children}
      </Container>
    </section>
  );
}
