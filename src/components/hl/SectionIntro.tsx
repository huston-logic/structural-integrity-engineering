import { Text } from "@/components/ui/Text";

type SectionIntroProps = {
  /** The heading's id, for the section's aria-labelledby. */
  id: string;
  heading: string;
  intro: string;
};

/**
 * A section's H2 with its intro line beside it, bottom-aligned on wide screens and stacked on phones (the option G
 * reference's "What we design" head). Rises into view (`.reveal`).
 */
export function SectionIntro({ id, heading, intro }: SectionIntroProps) {
  return (
    <div className="reveal mb-12 flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
      <h2 id={id} className="max-w-em-14 text-h2">
        <Text>{heading}</Text>
      </h2>
      <p className="max-w-em-28 text-mist">
        <Text>{intro}</Text>
      </p>
    </div>
  );
}
