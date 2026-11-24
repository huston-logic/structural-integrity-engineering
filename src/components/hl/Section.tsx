import type { ReactNode } from "react";
import { Container } from "./Container";

type SectionProps = {
  children: ReactNode;
  /** The band color. Pages alternate dusk and deep from section to section (docs/STYLE-GUIDE.md §4). */
  tone?: "dusk" | "deep";
  /** `default` is the 104px rhythm of the reference (80px on phones); `compact` is 88px (64px on phones). */
  spacing?: "default" | "compact";
  id?: string;
  /** The id of the section's heading. */
  labelledBy?: string;
  /** Classes for the inner Container (layout only; the padding comes from `spacing`). */
  className?: string;
};

const tones = { dusk: "bg-dusk", deep: "bg-dusk-deep" } as const;
const spacings = { default: "py-20 md:py-[104px]", compact: "py-16 md:py-[88px]" } as const;

/** A full-width band of the page with the page column inside. */
export function Section({ children, tone = "dusk", spacing = "default", id, labelledBy, className = "" }: SectionProps) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`${tones[tone]} ${spacings[spacing]}`}>
      <Container className={className}>{children}</Container>
    </section>
  );
}
