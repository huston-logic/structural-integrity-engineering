import Image from "next/image";
import Link from "next/link";
import { Text } from "@/components/ui/Text";
import { Section } from "./Section";

type ServiceChoicesProps = {
  heading: string;
  /** Each card's photo is decoration beside the title, so it has no alt text. */
  items: readonly { title: string; body: string; href: string; photo: { src: string; width: number; height: number } }[];
  headingId: string;
};

/** "Choose your service": the three services as photo cards, each a link to its page. */
export function ServiceChoices({ heading, items, headingId }: ServiceChoicesProps) {
  return (
    <Section tone="deep" labelledBy={headingId}>
      <h2 id={headingId} className="max-w-em-22 text-h2">
        <Text>{heading}</Text>
      </h2>
      <ul className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group block">
              <div className="reveal-zoom overflow-hidden">
                <Image
                  src={item.photo.src}
                  alt=""
                  width={item.photo.width}
                  height={item.photo.height}
                  loading="lazy"
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="aspect-4/3 w-full object-cover"
                />
              </div>
              <h3 className="mt-6 text-h3 underline decoration-transparent decoration-2 underline-offset-8 transition-colors group-hover:decoration-amber">
                <Text>{item.title}</Text>
              </h3>
              <p className="mt-3 text-small text-mist">
                <Text>{item.body}</Text>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
