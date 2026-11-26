import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { FiguresAndReasons } from "@/components/hl/FiguresAndReasons";
import type { figuresAndReasonsDefinition } from "./definition";

export function FiguresAndReasonsBlock({ content, headingId }: BlockProps<ContentOf<typeof figuresAndReasonsDefinition.fields>>) {
  const figures = content.figures.map((figure) => ({ value: Number(figure.value), unit: figure.unit, body: figure.body }));
  return <FiguresAndReasons figures={figures} heading={content.heading} items={content.items} headingId={headingId} />;
}
