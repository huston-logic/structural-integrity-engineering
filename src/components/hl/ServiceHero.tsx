import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { Container } from "./Container";
import { FadingDivider } from "./FadingDivider";
import { PageDrawing, type PageDrawingName } from "./PageDrawing";

type Copy = { src: string; width: number; height: number };

type ServiceHeroProps = {
  title: string;
  intro: string;
  overview: string;
  photo: Copy & { alt: string };
  /** The same photo at 800px, shown on phones (under 768px). */
  small?: Copy;
  /** The page's one line drawing, laid over the photo. */
  drawing: PageDrawingName;
  /** H1 on the page itself; H2 where the block is shown as an example. */
  headingLevel?: "h1" | "h2";
};

/**
 * The top of a service page: the title and the line under it, the overview, and the hero photo carrying the page's one
 * line drawing. Phones: title, photo, overview, so the photo is on the first screen. From lg: the title and the overview
 * in the left column, the photo beside them spanning both rows.
 */
export function ServiceHero({ title, intro, overview, photo, small, drawing, headingLevel = "h1" }: ServiceHeroProps) {
  const Heading = headingLevel;
  return (
    <section className="bg-dusk pb-20 pt-12 md:pb-26 md:pt-24">
      <Container className="grid items-start gap-y-10 lg:grid-cols-[1fr_1fr] lg:gap-x-20 lg:gap-y-0">
        <div className="lg:col-start-1 lg:row-start-1">
          <Heading className="max-w-em-12 text-title">
            <Text>{title}</Text>
          </Heading>
          <p className="mt-6 max-w-em-34 text-mist">
            <Text>{intro}</Text>
          </p>
        </div>
        <div className="relative lg:col-start-2 lg:row-photo lg:mt-3">
          <picture>
            {small ? <source media="(max-width: 767px)" srcSet={small.src} width={small.width} height={small.height} /> : null}
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 600px, 100vw"
              className="aspect-3/2 h-auto w-full object-cover"
            />
          </picture>
          <PageDrawing name={drawing} />
        </div>
        <div className="lg:col-start-1 lg:row-start-2">
          <FadingDivider className="mb-10 mt-10 hidden max-w-em-34 lg:block" />
          <p className="max-w-em-34 text-body">
            <Text>{overview}</Text>
          </p>
        </div>
      </Container>
    </section>
  );
}
