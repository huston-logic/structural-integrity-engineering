import { Text } from "@/components/ui/Text";
import { CellDividers } from "./CellDividers";

type Reason = { title: string; body: string };

/** A grid of short reasons: a 2-column grid (one column on phones), divider lines, no cards. */
export function ReasonGrid({ items, className = "" }: { items: readonly Reason[]; className?: string }) {
  return (
    <ul className={`grid gap-x-12 gap-y-14 md:grid-cols-2 ${className}`}>
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
  );
}
