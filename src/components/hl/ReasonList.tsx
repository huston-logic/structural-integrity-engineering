import { Text } from "@/components/ui/Text";
import { CellDividers } from "./CellDividers";
import { Container } from "./Container";

type ReasonListProps = {
  /** Makes the heading id unique when a page holds more than one list. */
  id: string;
  heading: string;
  items: readonly { title: string; body: string }[];
};

/** A titled list of items (docs/STYLE-GUIDE.md §7.21): the items in a 2-column grid (one column on phones), fading dividers, no cards. */
export function ReasonList({ id, heading, items }: ReasonListProps) {
  return (
    <section aria-labelledby={`${id}-title`} className="py-16 md:py-24">
      <Container>
        <h2 id={`${id}-title`} className="font-ui text-h2 font-bold">
          <Text>{heading}</Text>
        </h2>
        <ul className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.title} className="relative">
              <p className="font-ui text-item font-semibold"><Text>{item.title}</Text></p>
              <p className="mt-2 text-[17px] leading-[1.55]"><Text>{item.body}</Text></p>
              <CellDividers index={index} total={items.length} md={2} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
