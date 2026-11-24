import { Text } from "@/components/ui/Text";
import { CellDividers } from "./CellDividers";
import { Section } from "./Section";

type ReasonListProps = {
  /** Makes the heading id unique when a page holds more than one list. */
  id: string;
  heading: string;
  items: readonly { title: string; body: string }[];
  tone?: "dusk" | "deep";
};

/** A titled list of items: a 2-column grid (one column on phones), divider lines, no cards. */
export function ReasonList({ id, heading, items, tone = "deep" }: ReasonListProps) {
  return (
    <Section tone={tone} labelledBy={`${id}-title`}>
      <h2 id={`${id}-title`} className="max-w-[22em] text-h2">
        <Text>{heading}</Text>
      </h2>
      <ul className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2">
        {items.map((item, index) => (
          <li key={item.title} className="relative">
            <p className="text-h4 font-semibold">
              <Text>{item.title}</Text>
            </p>
            <p className="mt-2 text-small text-mist">
              <Text>{item.body}</Text>
            </p>
            <CellDividers index={index} total={items.length} md={2} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
