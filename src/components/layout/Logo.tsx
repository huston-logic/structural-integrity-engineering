import Image from "next/image";
import Link from "next/link";
import { Text } from "@/components/ui/Text";
import { siteConfig } from "@/content/site";

// Dylan's mark is dark navy and steel on a transparent background, so on the dusk header it would vanish. It sits on a
// snow hexagon (the same outline as the mark, a little larger) so the frame and letters keep their own colors and read
// at 9:1 against the bar. The mark file is never altered. The name stays as text beside it.
const markWidth = 1266;
const markHeight = 1370;

/** The logo mark on a light hexagon, then the business name as text, linking home. */
export function Logo() {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name}, home`}
      className="group inline-flex min-h-11 items-center gap-3 text-wordmark font-bold text-snow transition-colors hover:text-amber"
    >
      {siteConfig.logo ? (
        <span
          aria-hidden="true"
          className="grid h-12 w-11 shrink-0 place-items-center bg-snow [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]"
        >
          <Image
            src={siteConfig.logo}
            alt=""
            width={markWidth}
            height={markHeight}
            unoptimized
            priority
            className="h-[85%] w-auto"
          />
        </span>
      ) : null}
      <span className="min-w-0">
        <Text>{siteConfig.name}</Text>
      </span>
    </Link>
  );
}
