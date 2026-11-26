import Image from "next/image";
import { Text } from "@/components/ui/Text";
import { Section } from "./Section";

type WhatWeDoProps = {
  heading: string;
  items: readonly { title: string; body?: string }[];
  /** Small crops shown beside the list: one, or a pair. */
  photos: readonly { src: string; alt: string; width: number; height: number }[];
  headingId: string;
};

/** "What we do" on a service page: the list of work with its photos beside it. Only the photos move (`.reveal-zoom`). */
export function WhatWeDo({ heading, items, photos, headingId }: WhatWeDoProps) {
  const pair = photos.length > 1;
  const titlesOnly = items.every((item) => !item.body);
  return (
    <Section tone="deep" labelledBy={headingId} className="grid gap-14 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
      <div>
        <h2 id={headingId} className="max-w-em-22 text-h2">
          <Text>{heading}</Text>
        </h2>
        <ul className="mt-10 max-w-em-40 divide-y divide-rule/60 border-y border-rule/60">
          {items.map((item) => (
            <li key={item.title} className={titlesOnly ? "py-5" : "py-6"}>
              {/* A list of names alone reads as an index, so it gets the larger card-title size. */}
              <h3 className={titlesOnly ? "text-h3 font-medium" : "text-h4"}>
                <Text>{item.title}</Text>
              </h3>
              {item.body ? (
                <p className="mt-2 text-small text-mist">
                  <Text>{item.body}</Text>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      {/* From lg the photos stay in view beside the list while it scrolls (sticky, no JavaScript). */}
      <div
        className={`lg:sticky lg:top-below-header lg:self-start ${pair ? "grid grid-cols-2 items-start gap-4 md:gap-6" : ""}`}
      >
        {photos.map((photo, index) => (
          <div key={photo.src} className={`reveal-zoom overflow-hidden ${pair && index === 1 ? "mt-12 md:mt-20" : ""}`}>
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="lazy"
              sizes={pair ? "(min-width: 1024px) 260px, 45vw" : "(min-width: 1024px) 480px, 100vw"}
              className={`w-full object-cover ${pair ? "aspect-4/5" : "aspect-4/3"}`}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
