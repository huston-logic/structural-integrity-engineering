import { Text } from "@/components/ui/Text";
import { FigureList } from "./FigureList";
import { ReasonGrid } from "./ReasonList";
import { Section } from "./Section";

type FiguresAndReasonsProps = {
  figures: readonly { value: number; unit: string; body: string }[];
  heading: string;
  items: readonly { title: string; body: string }[];
  headingId: string;
};

/** The numbers and the reasons in one deep band, so the dusk contact band after it follows a deep section. */
export function FiguresAndReasons({ figures, heading, items, headingId }: FiguresAndReasonsProps) {
  return (
    <Section tone="deep" labelledBy={headingId}>
      <FigureList items={figures} />
      <h2 id={headingId} className="reveal mt-24 max-w-em-22 text-h2 md:mt-34">
        <Text>{heading}</Text>
      </h2>
      <ReasonGrid items={items} className="mt-12" />
    </Section>
  );
}
