import { CellDividers } from "@/components/hl/CellDividers";
import { Container } from "@/components/hl/Container";
import { Text } from "@/components/ui/Text";
import type { BlockProps } from "@/blocks/types";
import type { ContentOf } from "@/blocks/schema";
import type { highlightsDefinition } from "./definition";

/** A titled list of items (docs/STYLE-GUIDE.md §7.21): a grid, fading dividers, no cards. */
export function HighlightsBlock({ content, variant, anchor, headingId }: BlockProps<ContentOf<typeof highlightsDefinition.fields>>) {
  // Three columns only when there are three or more items, so two never sit beside an empty column.
  const three = variant === "three-column" && content.items.length >= 3;
  return (
    <section id={anchor} aria-labelledby={headingId} className="scroll-mt-24">
      <Container>
        <h2 id={headingId} className="font-ui text-h2 font-bold">
          <Text>{content.heading}</Text>
        </h2>
        <ul className={`mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2 ${three ? "lg:grid-cols-3" : ""}`}>
          {content.items.map((item, index) => (
            <li key={index} className="relative">
              <p className="font-ui text-item font-semibold">
                <Text>{item.title}</Text>
              </p>
              <p className="mt-2 text-list">
                <Text>{item.body}</Text>
              </p>
              <CellDividers index={index} total={content.items.length} md={2} lg={three ? 3 : undefined} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
