import Image from "next/image";
import { Text } from "@/components/ui/Text";
import type { ServiceCard } from "@/content/home";
import { HlLink } from "./HlLink";

// The card's rendered width: a third of the column from 900px, the column below.
const sizes = "(min-width: 1320px) 392px, (min-width: 900px) calc((100vw - 152px) / 3), calc(100vw - 44px)";

/**
 * Three photo cards, one per service page (three columns, stacked below 900px). The title is the link, stretched over
 * the whole card so the photo is clickable too; the title turns amber and draws the slow underline on hover and focus.
 * No card chrome: a square 4:5 photo that eases from 110% as it crosses the viewport (`.reveal-zoom`), then the text.
 * The photos are pre-cropped to 4:5; images are unoptimized (static export), so the <source> offers the 660px copy.
 */
export function ServiceCards({ items }: { items: readonly ServiceCard[] }) {
  return (
    <ul className="grid gap-10 min-[900px]:grid-cols-3 min-[900px]:gap-7">
      {items.map((item) => (
        <li key={item.href} className="reveal relative flex flex-col gap-[18px]">
          <div className="reveal-zoom aspect-[4/5] overflow-hidden bg-night">
            <picture>
              <source
                srcSet={`${item.photoSmall.src} ${item.photoSmall.width}w, ${item.photo.src} ${item.photo.width}w`}
                sizes={sizes}
              />
              <Image
                src={item.photo.src}
                alt={item.photo.alt}
                width={item.photo.width}
                height={item.photo.height}
                sizes={sizes}
                className="size-full object-cover"
              />
            </picture>
          </div>
          <h3 className="text-h3">
            <HlLink
              href={item.href}
              className="text-snow transition-colors after:absolute after:inset-0 hover:text-amber focus-visible:text-amber"
            >
              <span className="hl-u">
                <Text>{item.title}</Text>
              </span>
            </HlLink>
          </h3>
          <p className="text-small text-mist">
            <Text>{item.body}</Text>
          </p>
        </li>
      ))}
    </ul>
  );
}
