import { Text } from "@/components/ui/Text";
import { CountUp } from "./CountUp";

type FigureListProps = {
  items: readonly { value: number; unit: string; body: string }[];
};

/**
 * The home numbers: a big light amber figure that counts up as it scrolls into view (CountUp), its unit beside it and
 * the line under it. Two or three columns from 900px (one per figure), stacked on phones.
 */
export function FigureList({ items }: FigureListProps) {
  return (
    <ul
      className={`grid gap-12 split:gap-8 ${items.length === 2 ? "split:grid-cols-2" : "split:grid-cols-3"}`}
    >
      {items.map((item) => (
        <li key={item.unit} className="flex flex-col gap-2.5">
          <p className="flex items-baseline gap-3">
            <CountUp value={item.value} className="text-figure font-light text-amber" />
            <span className="text-h4 font-semibold">
              <Text>{item.unit}</Text>
            </span>
          </p>
          <p className="max-w-em-22 text-small text-mist">
            <Text>{item.body}</Text>
          </p>
        </li>
      ))}
    </ul>
  );
}
