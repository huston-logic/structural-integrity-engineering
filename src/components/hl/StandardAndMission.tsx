import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { Container } from "./Container";
import { FadingDivider } from "./FadingDivider";

type StandardAndMissionProps = {
  standard: { heading: string; line: string; photo: { src: string; alt: string; width: number; height: number } };
  mission: { heading: string; body: string };
  headingId: string;
};

/** About: the one place the site lists licensing, over a wide Colorado photo, then the mission under a divider. */
export function StandardAndMission({ standard, mission, headingId }: StandardAndMissionProps) {
  return (
    <section aria-labelledby={headingId} className="bg-dusk-deep py-20 md:py-26">
      <Container>
        <h2 id={headingId} className="max-w-em-16 text-h2">
          <Text>{standard.heading}</Text>
        </h2>
        <div className="reveal-zoom mt-12 overflow-hidden">
          <Image
            src={standard.photo.src}
            alt={standard.photo.alt}
            width={standard.photo.width}
            height={standard.photo.height}
            loading="lazy"
            sizes="(min-width: 1200px) 1136px, 100vw"
            className="aspect-3/2 w-full object-cover md:aspect-2/1"
          />
        </div>
        <p className="mt-8 text-h4 font-semibold">
          <Text>{standard.line}</Text>
        </p>
        <FadingDivider className="mt-20" />
        <h2 className="mt-20 max-w-em-16 text-h2">
          <Text>{mission.heading}</Text>
        </h2>
        <p className="mt-8 max-w-em-34 text-h3 font-normal leading-snug text-mist">
          <Text>{mission.body}</Text>
        </p>
      </Container>
    </section>
  );
}
