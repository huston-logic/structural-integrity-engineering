import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { hero } from "@/content/home";
import { requestQuote } from "@/content/nav";
import { Button } from "./Button";
import { Container } from "./Container";
import { HeroDrawing } from "./HeroDrawing";

/**
 * The home first screen (docs/STYLE-GUIDE.md §5): the centered headline, the line under it and Request a quote in the
 * photo's sky, over the dusk home with the amber line drawing on the house. Layout and crop live in hl.css (`hl-hero*`).
 */
export function HomeHero() {
  const { photo, photoSmall } = hero;
  // Images are unoptimized (static export), so next/image makes no srcset; the <source> offers the 1200px copy to
  // phones (the LCP image there) and the full 2000px file to wide screens.
  const sizes = "(min-width: 900px) 100vw, 150vw";
  return (
    <section aria-labelledby="hero-title" className="hl-hero">
      <div className="hl-hero-copy">
        <Container className="flex flex-col items-center gap-5 pb-7 pt-2 text-center min-[900px]:pt-5">
          <h1 id="hero-title" className="text-hero">
            <Text>{hero.title}</Text>
          </h1>
          <p className="max-w-[34em] text-mist">
            <Text>{hero.intro}</Text>
          </p>
          <Button href={requestQuote.href}>{requestQuote.label}</Button>
        </Container>
      </div>
      <div className="hl-hero-stage">
        <div className="hl-hero-media">
          <picture>
            <source srcSet={`${photoSmall.src} ${photoSmall.width}w, ${photo.src} ${photo.width}w`} sizes={sizes} />
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
          <HeroDrawing labels={hero.labels} />
        </div>
        <div aria-hidden="true" className="hl-hero-fade-top" />
        <div aria-hidden="true" className="hl-hero-fade-bottom" />
      </div>
    </section>
  );
}
