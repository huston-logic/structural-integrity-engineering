import type { ReactNode } from "react";
import { Text } from "@/components/ui/Text";
import { Container } from "./Container";
import { Eyebrow } from "./Eyebrow";
import { PageDrawing, type PageDrawingName } from "./PageDrawing";

type HeroTextProps = {
  eyebrow?: string;
  /** The page's single H1. A string is rendered with `Text`, so [[placeholders]] show as markers. */
  title: ReactNode;
  intro?: ReactNode;
  /** The call to action this page's copy gives it. */
  children?: ReactNode;
  /** H1 for a page's own hero; the block showcase shows further heroes as H2. */
  headingLevel?: "h1" | "h2";
  headingId?: string;
};

type PageHeroProps = Omit<HeroTextProps, "headingLevel" | "headingId"> & {
  /** The page's one line drawing (see PageDrawing). Under the text (smaller on phones), then beside it from 1024px. */
  drawing?: PageDrawingName;
};

const asText = (node: ReactNode) => (typeof node === "string" ? <Text>{node}</Text> : node);

/** The words of a page's top: eyebrow, heading, intro in mist and the action, left-aligned. No section, spacing or drawing: the caller adds those. */
export function HeroCopy({ eyebrow, title, intro, children, headingLevel = "h1", headingId }: HeroTextProps) {
  const Heading = headingLevel;
  return (
    <div>
      {eyebrow ? (
        <Eyebrow>
          <Text>{eyebrow}</Text>
        </Eyebrow>
      ) : null}
      <Heading id={headingId} className={`${eyebrow ? "mt-4 " : ""}max-w-em-16 text-title`}>
        {asText(title)}
      </Heading>
      {intro ? <p className="mt-6 max-w-em-38 text-mist">{asText(intro)}</p> : null}
      {children ? <div className="mt-10">{children}</div> : null}
    </div>
  );
}

/** The hero words in the page column. The library hero block builds on this; the page keeps its own spacing from the renderer. */
export function HeroContent(props: HeroTextProps) {
  return (
    <Container>
      <HeroCopy {...props} />
    </Container>
  );
}

/** A plain text page top on dusk: H1, intro in mist and the action, left-aligned, with an optional line drawing. Photo heroes are their own component. */
export function PageHero({ eyebrow, title, intro, children, drawing, headingLevel, headingId }: PageHeroProps & Pick<HeroTextProps, "headingLevel" | "headingId">) {
  const copy = <HeroCopy eyebrow={eyebrow} title={title} intro={intro} headingLevel={headingLevel} headingId={headingId}>{children}</HeroCopy>;
  return (
    <section className="bg-dusk pb-16 pt-16 md:pb-24 md:pt-24">
      {drawing ? (
        <Container className="grid items-center gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          {copy}
          <PageDrawing name={drawing} className="max-w-art-sm md:max-w-art lg:justify-self-end" />
        </Container>
      ) : (
        <Container>{copy}</Container>
      )}
    </section>
  );
}
