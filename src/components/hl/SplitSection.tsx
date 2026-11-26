import type { ReactNode } from "react";
import { Section } from "./Section";

type SplitSectionProps = {
  /** The heading's id, for the section's aria-labelledby. */
  id: string;
  /** The H2's content (a `Text` or a link). */
  heading: ReactNode;
  children: ReactNode;
  tone?: "dusk" | "deep";
  spacing?: "default" | "compact";
};

/**
 * A section whose H2 sits in a narrow left column with the content beside it from 1024px (stacked on phones), so a
 * short list or paragraph uses the width instead of leaving the right half of the page empty.
 */
export function SplitSection({ id, heading, children, tone, spacing }: SplitSectionProps) {
  return (
    <Section
      tone={tone}
      spacing={spacing}
      labelledBy={id}
      className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20"
    >
      <h2 id={id} className="max-w-em-12 text-h2">
        {heading}
      </h2>
      <div className="lg:pt-3">{children}</div>
    </Section>
  );
}
