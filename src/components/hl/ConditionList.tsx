import { Text } from "@/components/ui/Text";
import { ConditionGlyph, type ConditionGlyphName } from "./ConditionGlyph";

type ConditionListProps = {
  items: readonly { glyph: ConditionGlyphName; title: string; body: string }[];
};

/** The design conditions: four columns (two on phones), each under a rule line with its amber glyph. */
export function ConditionList({ items }: ConditionListProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-8 split:grid-cols-4 split:gap-10">
      {items.map((item) => (
        <li key={item.title} className="reveal flex flex-col gap-3.5 border-t border-rule pt-5">
          <ConditionGlyph name={item.glyph} />
          <h3 className="text-h4">
            <Text>{item.title}</Text>
          </h3>
          <p className="text-small text-mist">
            <Text>{item.body}</Text>
          </p>
        </li>
      ))}
    </ul>
  );
}
