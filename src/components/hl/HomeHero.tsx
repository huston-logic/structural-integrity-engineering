import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { Button } from "./Button";
import { Container } from "./Container";
import { HeroDrawing } from "./HeroDrawing";

type Copy = { src: string; width: number; height: number };

type HomeHeroProps = {
  title: string;
  intro: string;
  action: { label: string; href: string };
  photo: Copy & { alt: string };
  /** The same photo at 1200px, offered to phones through srcset. */
  small?: Copy;
  /** The same photo at 800px, for phone screens under 2x density. */
  phone?: Copy;
  /** The labels on the amber line drawing over the house. The drawing is decorative (aria-hidden). */
  labels: { cantilever: string; clearSpan: string; wind: string };
  /** H1 on the home page itself; H2 where the block is shown as an example. */
  headingLevel?: "h1" | "h2";
  headingId: string;
};

/**
 * The home first screen (docs/STYLE-GUIDE.md §5): the centered headline, the line under it and Request a quote in the
 * photo's sky, over the dusk home with the amber line drawing on the house. Layout and crop live in hl.css (`hl-hero*`).
 */
export function HomeHero({ title, intro, action, photo, small, phone, labels, headingLevel = "h1", headingId }: HomeHeroProps) {
  const Heading = headingLevel;
  // Images are unoptimized (static export), so next/image makes no srcset. Phone screens under 2x density get the 800px
  // copy (the LCP image there: about 63 KB); sharper phone screens choose between the 1200px copy and the full 2000px
  // file, as wide screens do.
  const sizes = "(min-width: 900px) 100vw, 150vw";
  return (
    <section aria-labelledby={headingId} className="hl-hero">
      <div className="hl-hero-copy">
        <Container className="flex flex-col items-center gap-5 pb-7 pt-2 text-center split:pt-5">
          <Heading id={headingId} className="text-hero">
            <Text>{title}</Text>
          </Heading>
          <p className="max-w-em-34 text-mist">
            <Text>{intro}</Text>
          </p>
          <Button href={action.href}>{action.label}</Button>
        </Container>
      </div>
      <div className="hl-hero-stage">
        <div className="hl-hero-media">
          <picture>
            {phone ? <source media="(max-width: 899px) and (max-resolution: 1.99dppx)" srcSet={phone.src} /> : null}
            {small ? <source srcSet={`${small.src} ${small.width}w, ${photo.src} ${photo.width}w`} sizes={sizes} /> : null}
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="eager"
              fetchPriority="high"
              sizes={sizes}
            />
          </picture>
          <HeroDrawing labels={labels} />
        </div>
        <div aria-hidden="true" className="hl-hero-fade-top" />
        <div aria-hidden="true" className="hl-hero-fade-bottom" />
      </div>
    </section>
  );
}
