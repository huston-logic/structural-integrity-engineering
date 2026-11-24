import type { ReactNode } from "react";
import { Text } from "@/components/ui/Text";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";

type PageHeroProps = {
  eyebrow?: string;
  /** The page's single H1. A string is rendered with `Text`, so [[placeholders]] show as markers. */
  title: ReactNode;
  intro?: ReactNode;
  /** The call to action this page's copy gives it. */
  children?: ReactNode;
};

const asText = (node: ReactNode) => (typeof node === "string" ? <Text>{node}</Text> : node);

/** A plain text page top on dusk: H1, intro in mist and the action, left-aligned. Static. Photo heroes are their own component. */
export function PageHero({ eyebrow, title, intro, children }: PageHeroProps) {
  return (
    <section className="bg-dusk pb-16 pt-16 md:pb-24 md:pt-24">
      <Container>
        {eyebrow ? (
          <Eyebrow>
            <Text>{eyebrow}</Text>
          </Eyebrow>
        ) : null}
        <h1 className={`${eyebrow ? "mt-4 " : ""}max-w-[16em] text-title`}>{asText(title)}</h1>
        {intro ? <p className="mt-6 max-w-[38em] text-mist">{asText(intro)}</p> : null}
        {children ? <div className="mt-10">{children}</div> : null}
      </Container>
    </section>
  );
}
