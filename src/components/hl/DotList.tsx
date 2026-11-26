import { Text } from "@/components/ui/Text";

/** A list with a 7px amber dot as its bullet, 12px from the text. Items take **bold** and [[placeholders]]. */
export function DotList({ items, className = "" }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-dot size-1.75 shrink-0 rounded-pill bg-amber" />
          <span>
            <Text>{item}</Text>
          </span>
        </li>
      ))}
    </ul>
  );
}
