import type { ContentOf } from "@/blocks/schema";
import type { BlockProps } from "@/blocks/types";
import { Statement } from "@/components/hl/Statement";
import type { statementDefinition } from "./definition";

export function StatementBlock({ content }: BlockProps<ContentOf<typeof statementDefinition.fields>>) {
  return <Statement text={content.text} />;
}
