import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { Container } from "./Container";
import { PageDrawing, type PageDrawingName } from "./PageDrawing";

type Copy = { src: string; width: number; height: number };

type PhotoHeroProps = {
  title: string;
  intro: string;
  photo: Copy & { alt: string };
  /** The same photo at 800px, shown on phones (under 768px). */
  small?: Copy;
  /** The page's one line drawing, laid over the photo. */
  drawing: PageDrawingName;
  /** H1 on the page itself; H2 where the block is shown as an example. */
  headingLevel?: "h1" | "h2";
};

/** A page top with the text on the left and a photo on the right, carrying the page's one line drawing (docs/STYLE-GUIDE.md §5). */
export function PhotoHero({ title, intro, photo, small, drawing, headingLevel = "h1" }: PhotoHeroProps) {
  const Heading = headingLevel;
  return (
    <section className="bg-dusk pb-20 pt-16 md:pb-26 md:pt-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <Heading className="max-w-em-12 text-title">
            <Text>{title}</Text>
          </Heading>
          <p className="mt-6 max-w-em-34 text-mist">
            <Text>{intro}</Text>
          </p>
        </div>
        <div className="relative">
          <picture>
            {small ? <source media="(max-width: 767px)" srcSet={small.src} width={small.width} height={small.height} /> : null}
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 560px, 100vw"
              className="h-auto w-full object-cover"
            />
          </picture>
          <PageDrawing name={drawing} />
        </div>
      </Container>
    </section>
  );
}
