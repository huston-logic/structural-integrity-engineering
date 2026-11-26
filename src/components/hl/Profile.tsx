import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { Section } from "./Section";

type ProfileProps = {
  heading: string;
  body: string;
  photo: { src: string; alt: string; width: number; height: number };
  headingId: string;
};

/** A person's portrait beside a heading and a paragraph (About: the principal engineer). */
export function Profile({ heading, body, photo, headingId }: ProfileProps) {
  return (
    <Section tone="dusk" labelledBy={headingId} className="grid items-center gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-20">
      <div className="reveal-zoom overflow-hidden">
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          sizes="(min-width: 1024px) 420px, 100vw"
          className="h-auto w-full max-w-portrait object-cover lg:max-w-none"
        />
      </div>
      <div>
        <h2 id={headingId} className="max-w-em-16 text-h2">
          <Text>{heading}</Text>
        </h2>
        <p className="mt-8 max-w-em-38 text-body text-mist">
          <Text>{body}</Text>
        </p>
      </div>
    </Section>
  );
}
