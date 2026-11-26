import { Text } from "@/components/ui/Text";
import { HlLink } from "./HlLink";
import { SplitSection } from "./SplitSection";

type HowWeWorkTeaserProps = {
  heading: string;
  /** Where the heading links: the full How we work. */
  href: string;
  stepTitle: string;
  stepBody: string;
  headingId: string;
};

/** The short How we work on a service page: step 1 of the six, under a heading that links to the full list. */
export function HowWeWorkTeaser({ heading, href, stepTitle, stepBody, headingId }: HowWeWorkTeaserProps) {
  return (
    <SplitSection
      id={headingId}
      tone="deep"
      spacing="compact"
      heading={
        <HlLink
          href={href}
          className="text-snow underline decoration-mist/60 decoration-2 underline-offset-tight-em transition-colors hover:text-amber hover:decoration-amber"
        >
          <Text>{heading}</Text>
        </HlLink>
      }
    >
      <p className="max-w-em-40 text-body text-mist">
        <strong className="font-semibold text-snow">
          <Text>{stepTitle}</Text>.
        </strong>{" "}
        <Text>{stepBody}</Text>
      </p>
    </SplitSection>
  );
}
