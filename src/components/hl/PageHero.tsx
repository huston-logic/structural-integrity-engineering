import type { ReactNode } from "react";
import { Text } from "@/components/ui/Text";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { PageDrawing, type PageDrawingName } from "./PageDrawing";

type PageHeroProps = {
  eyebrow?: string;
  /** The page's single H1. A string is rendered with `Text`, so [[placeholders]] show as markers. */
  title: ReactNode;
  intro?: ReactNode;
  /** The call to action this page's copy gives it. */
  children?: ReactNode;
  /** The page's one line drawing (see PageDrawing). Under the text (smaller on phones), then beside it from 1024px. */
  drawing?: PageDrawingName;
};

const asText = (node: ReactNode) => (typeof node === "string" ? <Text>{node}</Text> : node);

/** A plain text page top on dusk: H1, intro in mist and the action, left-aligned, with an optional line drawing. Photo heroes are their own component. */
export function PageHero({ eyebrow, title, intro, children, drawing }: PageHeroProps) {
  const copy = (
    <div>
      {eyebrow ? (
        <Eyebrow>
          <Text>{eyebrow}</Text>
        </Eyebrow>
      ) : null}
      <h1 className={`${eyebrow ? "mt-4 " : ""}max-w-[16em] text-title`}>{asText(title)}</h1>
      {intro ? <p className="mt-6 max-w-[38em] text-mist">{asText(intro)}</p> : null}
      {children ? <div className="mt-10">{children}</div> : null}
    </div>
  );
  return (
    <section className="bg-dusk pb-16 pt-16 md:pb-24 md:pt-24">
      {drawing ? (
        <Container className="grid items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          {copy}
          <PageDrawing name={drawing} className="max-w-[260px] md:max-w-[440px] lg:justify-self-end" />
        </Container>
      ) : (
        <Container>{copy}</Container>
      )}
    </section>
  );
}
